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

        order = OrderService.place_order(
            user       = request.user,
            address_id = str(serializer.validated_data["address_id"]),
            notes      = serializer.validated_data.get("notes", ""),
        )

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