"""
Payments Views — thin HTTP handlers. All logic in services.py.

Endpoints:
    POST   /api/v1/payments/create/    → create Razorpay order (step 1)
    POST   /api/v1/payments/verify/    → verify payment signature (step 2)
    POST   /api/v1/payments/webhook/   → Razorpay server webhook (backup)
    GET    /api/v1/payments/           → payment history for current user

Flow:
    1. Frontend places order → POST /orders/  → gets order_id
    2. Frontend calls POST /payments/create/  → gets razorpay_order_id + key
    3. Frontend opens Razorpay checkout modal
    4. User pays → Razorpay returns payment_id + signature to frontend
    5. Frontend calls POST /payments/verify/  → backend verifies + marks PAID
"""
import logging

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.orders.serializers import OrderDetailSerializer
from .models import Payment
from .serializers import (
    CreatePaymentSerializer,
    PaymentDetailSerializer,
    VerifyPaymentSerializer,
)
from .services import PaymentService

logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


# ── Create Razorpay Order ─────────────────────────────────────
class CreatePaymentView(APIView):
    """
    POST /payments/create/
    Body: { "order_id": "<uuid>" }

    Creates a Razorpay order and returns everything the frontend
    needs to open the Razorpay checkout modal.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Payments"], request=CreatePaymentSerializer)
    def post(self, request):
        serializer = CreatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = PaymentService.create_razorpay_order(
            user     = request.user,
            order_id = str(serializer.validated_data["order_id"]),
        )

        return Response(data, status=status.HTTP_201_CREATED)


# ── Verify Payment ────────────────────────────────────────────
class VerifyPaymentView(APIView):
    """
    POST /payments/verify/
    Body: {
        "razorpay_order_id":   "order_xxx",
        "razorpay_payment_id": "pay_xxx",
        "razorpay_signature":  "abc123..."
    }

    Verifies HMAC signature. On success:
    - Marks Payment → SUCCESS
    - Marks Order   → PAID + CONFIRMED
    Returns the updated full order detail.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Payments"], request=VerifyPaymentSerializer)
    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = PaymentService.verify_payment(
            razorpay_order_id   = serializer.validated_data["razorpay_order_id"],
            razorpay_payment_id = serializer.validated_data["razorpay_payment_id"],
            razorpay_signature  = serializer.validated_data["razorpay_signature"],
        )

        return Response(
            {
                "message": "Payment verified successfully.",
                "order":   OrderDetailSerializer(order).data,
            },
            status=status.HTTP_200_OK,
        )


# ── Razorpay Webhook ──────────────────────────────────────────
@method_decorator(csrf_exempt, name="dispatch")
class WebhookView(APIView):
    """
    POST /payments/webhook/
    Called by Razorpay servers — NOT by the frontend.

    Must be CSRF exempt (Razorpay can't send CSRF tokens).
    Register this URL in: Razorpay Dashboard → Settings → Webhooks

    Events handled:
      - payment.captured → marks order PAID (backup for /verify/)
      - payment.failed   → marks payment FAILED
    """
    permission_classes = [permissions.AllowAny]  # Razorpay hits this unauthenticated
    authentication_classes = []                   # Skip JWT for webhooks

    @extend_schema(tags=["Payments"], exclude=True)
    def post(self, request):
        payload   = request.body
        signature = request.headers.get("X-Razorpay-Signature", "")

        result = PaymentService.handle_webhook(
            payload=payload,
            razorpay_signature=signature,
        )

        return Response(result, status=status.HTTP_200_OK)


# ── Payment History ───────────────────────────────────────────
class PaymentListView(APIView):
    """
    GET /payments/
    Returns payment history for the current user.
    Admin sees all; customer sees only their own.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Payments"])
    def get(self, request):
        if request.user.role == "admin":
            payments = Payment.objects.select_related("order").order_by("-created_at")[:50]
        else:
            payments = Payment.objects.select_related("order").filter(
                order__user=request.user
            ).order_by("-created_at")

        serializer = PaymentDetailSerializer(payments, many=True)
        return Response(serializer.data)