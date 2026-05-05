"""
Orders Views — thin HTTP handlers. All logic in services.py.

Customer endpoints:
  GET    /api/v1/orders/                  → order history (paginated)
  POST   /api/v1/orders/                  → place order from cart
  GET    /api/v1/orders/{id}/             → order detail
  POST   /api/v1/orders/{id}/cancel/      → cancel order (restore stock)

Address endpoints:
  GET    /api/v1/orders/addresses/        → list saved addresses
  POST   /api/v1/orders/addresses/        → add new address
  PATCH  /api/v1/orders/addresses/{id}/   → update address
  DELETE /api/v1/orders/addresses/{id}/   → delete address

Admin endpoints:
  GET    /api/v1/orders/admin/            → all orders (any user)
  PATCH  /api/v1/orders/admin/{id}/status/ → update order status
"""
import logging
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema

from apps.users.models import UserAddress
from .models import Order
from .serializers import (
    UserAddressSerializer, UserAddressWriteSerializer,
    OrderListSerializer, OrderDetailSerializer,
    PlaceOrderSerializer, UpdateOrderStatusSerializer,
)
from .services import OrderService

from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from apps.products.models import ProductVariant

logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class OrderPagination(PageNumberPagination):
    page_size            = 10
    page_size_query_param = "page_size"
    max_page_size        = 50


# ── Addresses ─────────────────────────────────────────────────
class AddressListCreateView(generics.ListCreateAPIView):
    """
    GET  → list all saved addresses for the current user
    POST → add a new delivery address
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserAddressWriteSerializer
        return UserAddressSerializer

    @extend_schema(tags=["Orders | Addresses"])
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    → single address detail
    PATCH  → update address fields
    DELETE → delete address
    """
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ["get", "patch", "delete"]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return UserAddressWriteSerializer
        return UserAddressSerializer

    @extend_schema(tags=["Orders | Addresses"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ── Orders ────────────────────────────────────────────────────
class OrderListCreateView(APIView):
    """
    GET  → paginated order history for current user
    POST → place a new order from the current cart
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Orders"])
    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by("-placed_at")
        paginator = OrderPagination()
        page = paginator.paginate_queryset(orders, request)
        serializer = OrderListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(tags=["Orders"], request=PlaceOrderSerializer)
    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment_method = serializer.validated_data.get(
            "payment_method", Order.PaymentMethod.ONLINE
        )

        order = OrderService.place_order(
            user       = request.user,
            address_id = str(serializer.validated_data["address_id"]),
            notes      = serializer.validated_data.get("notes", ""),
        )

        # Set payment method + handle COD immediately
        update_fields = ["payment_method"]
        order.payment_method = payment_method

        if payment_method == Order.PaymentMethod.COD:
            order.status = Order.Status.CONFIRMED   # no Razorpay needed
            update_fields.append("status")

        order.save(update_fields=update_fields)

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderDetailView(APIView):
    """
    GET → full order detail (items, shipping, payment status, can_cancel)
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Orders"])
    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related("items").get(
                id=pk, user=request.user
            )
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(OrderDetailSerializer(order).data)


class OrderCancelView(APIView):
    """
    POST /orders/{id}/cancel/
    Cancels the order if eligible and restores stock.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Orders"])
    def post(self, request, pk):
        order = OrderService.cancel_order(
            user     = request.user,
            order_id = str(pk),
        )
        return Response(
            {
                "message": f"Order {order.order_number} has been cancelled.",
                "order":   OrderDetailSerializer(order).data,
            }
        )


# ── Admin ─────────────────────────────────────────────────────
class AdminOrderListView(generics.ListAPIView):
    """
    GET /orders/admin/ → all orders (any user), newest first.
    Supports ?status= and ?payment_status= filters.
    """
    permission_classes   = [IsAdminUser]
    serializer_class     = OrderListSerializer
    pagination_class     = OrderPagination

    def get_queryset(self):
        qs = Order.objects.select_related("user").order_by("-placed_at")
        status_filter = self.request.query_params.get("status")
        payment_filter = self.request.query_params.get("payment_status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if payment_filter:
            qs = qs.filter(payment_status=payment_filter)
        return qs

    @extend_schema(tags=["Orders | Admin"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AdminOrderStatusView(APIView):
    """
    PATCH /orders/admin/{id}/status/
    Admin-only: transition order to a new status.
    Validates against allowed transitions table.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(tags=["Orders | Admin"], request=UpdateOrderStatusSerializer)
    def patch(self, request, pk):
        serializer = UpdateOrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = OrderService.update_order_status(
            order_id   = str(pk),
            new_status = serializer.validated_data["status"],
        )

        return Response(
            {
                "message": f"Order {order.order_number} updated to '{order.get_status_display()}'.",
                "order":   OrderDetailSerializer(order).data,
            }
        )
    

# ── Admin Dashboard ───────────────────────────────────────────
class AdminDashboardView(APIView):
    """
    GET /orders/admin/dashboard/
 
    Returns everything the admin dashboard needs in a single request:
      - stats:             revenue, order counts, user count
      - revenue_chart:     daily revenue for last 30 days
      - recent_orders:     last 10 orders across all users
      - low_stock:         variants with stock ≤ 5
      - status_breakdown:  order counts per status
      - payment_breakdown: COD vs online split
    """
    permission_classes = [IsAdminUser]
 
    def get(self, request):
        from django.db.models import Sum, Count, Q
        from django.db.models.functions import TruncDate
        from django.utils import timezone
        from datetime import timedelta
        from django.contrib.auth import get_user_model
        from apps.products.models import ProductVariant
 
        User  = get_user_model()
        now   = timezone.now()
        today = now.date()
        month_start       = today.replace(day=1)
        thirty_days_ago   = today - timedelta(days=29)
 
        # ── Core order querysets ───────────────────────────
        all_orders  = Order.objects.all()
        paid_orders = all_orders.filter(payment_status=Order.PaymentStatus.PAID)
 
        # ── Stats block ────────────────────────────────────
        total_revenue = paid_orders.aggregate(
            total=Sum("total_amount")
        )["total"] or 0
 
        revenue_today = paid_orders.filter(
            placed_at__date=today
        ).aggregate(total=Sum("total_amount"))["total"] or 0
 
        revenue_this_month = paid_orders.filter(
            placed_at__date__gte=month_start
        ).aggregate(total=Sum("total_amount"))["total"] or 0
 
        stats = {
            "total_revenue":        float(total_revenue),
            "revenue_today":        float(revenue_today),
            "revenue_this_month":   float(revenue_this_month),
            "total_orders":         all_orders.count(),
            "orders_today":         all_orders.filter(placed_at__date=today).count(),
            "orders_this_month":    all_orders.filter(placed_at__date__gte=month_start).count(),
            "pending_orders":       all_orders.filter(status=Order.Status.PENDING).count(),
            "confirmed_orders":     all_orders.filter(status=Order.Status.CONFIRMED).count(),
            "total_customers":      User.objects.filter(role="customer").count(),
            "new_customers_today":  User.objects.filter(
                role="customer", date_joined__date=today
            ).count(),
        }
 
        # ── Revenue chart — last 30 days ───────────────────
        revenue_chart = list(
            paid_orders
            .filter(placed_at__date__gte=thirty_days_ago)
            .annotate(date=TruncDate("placed_at"))
            .values("date")
            .annotate(
                revenue=Sum("total_amount"),
                orders=Count("id"),
            )
            .order_by("date")
            .values("date", "revenue", "orders")
        )
        # Convert date + Decimal to JSON-safe types
        revenue_chart = [
            {
                "date":    str(row["date"]),
                "revenue": float(row["revenue"]),
                "orders":  row["orders"],
            }
            for row in revenue_chart
        ]
 
        # ── Recent orders (last 10) ────────────────────────
        recent_orders = (
            Order.objects
            .select_related("user")
            .order_by("-placed_at")[:10]
        )
        recent_orders_data = [
            {
                "id":             str(o.id),
                "order_number":   o.order_number,
                "user_email":     o.user.email,
                "user_name":      o.user.get_full_name() or o.user.email,
                "status":         o.status,
                "payment_status": o.payment_status,
                "payment_method": o.payment_method,
                "total_amount":   float(o.total_amount),
                "placed_at":      o.placed_at.isoformat(),
            }
            for o in recent_orders
        ]
 
        # ── Low stock variants (stock ≤ 5) ─────────────────
        low_stock_variants = (
            ProductVariant.objects
            .filter(is_active=True, stock__lte=5)
            .select_related("product")
            .order_by("stock")[:15]
        )
        low_stock_data = [
            {
                "variant_id":    str(v.id),
                "product_title": v.product.title,
                "sku":           v.sku,
                "size":          v.size,
                "color":         v.color,
                "stock":         v.stock,
                "is_out":        v.stock == 0,
            }
            for v in low_stock_variants
        ]
 
        # ── Order status breakdown ─────────────────────────
        status_breakdown = list(
            all_orders
            .values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )
 
        # ── Payment method breakdown ───────────────────────
        payment_breakdown = list(
            all_orders
            .values("payment_method")
            .annotate(count=Count("id"))
            .order_by("payment_method")
        )
 
        return Response({
            "stats":             stats,
            "revenue_chart":     revenue_chart,
            "recent_orders":     recent_orders_data,
            "low_stock":         low_stock_data,
            "status_breakdown":  status_breakdown,
            "payment_breakdown": payment_breakdown,
        })