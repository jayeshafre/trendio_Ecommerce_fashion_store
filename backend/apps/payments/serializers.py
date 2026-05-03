"""
Payments serializers.

CreatePaymentSerializer   → input for POST /payments/create/
VerifyPaymentSerializer   → input for POST /payments/verify/
PaymentResponseSerializer → output after create (sent to frontend)
PaymentDetailSerializer   → output for payment history
"""
from rest_framework import serializers
from .models import Payment


# ── Input: Create Razorpay order ──────────────────────────────
class CreatePaymentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField(
        help_text="UUID of the placed order to initiate payment for"
    )


# ── Input: Verify payment after checkout ──────────────────────
class VerifyPaymentSerializer(serializers.Serializer):
    razorpay_order_id   = serializers.CharField(
        help_text="Razorpay order ID (order_xxx)"
    )
    razorpay_payment_id = serializers.CharField(
        help_text="Razorpay payment ID (pay_xxx) — returned after user pays"
    )
    razorpay_signature  = serializers.CharField(
        help_text="HMAC-SHA256 signature from Razorpay checkout handler"
    )


# ── Output: Payment detail row ────────────────────────────────
class PaymentDetailSerializer(serializers.ModelSerializer):
    amount_rupees  = serializers.FloatField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    order_number   = serializers.CharField(source="order.order_number", read_only=True)

    class Meta:
        model  = Payment
        fields = [
            "id",
            "order_number",
            "razorpay_order_id",
            "razorpay_payment_id",
            "status",
            "status_display",
            "signature_verified",
            "amount_rupees",
            "failure_reason",
            "created_at",
        ]