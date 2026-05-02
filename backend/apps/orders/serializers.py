"""
Orders serializers.

UserAddressSerializer      → read address
UserAddressWriteSerializer → create/update address
OrderItemSerializer        → one item row inside an order
OrderListSerializer        → lightweight list (order history)
OrderDetailSerializer      → full order (items + address)
PlaceOrderSerializer       → input for POST /orders/
UpdateOrderStatusSerializer→ admin input for status change
"""
from rest_framework import serializers
from .models import Order, OrderItem
from apps.users.models import UserAddress


# ── Address ───────────────────────────────────────────────────
class UserAddressSerializer(serializers.ModelSerializer):
    formatted = serializers.CharField(read_only=True)

    class Meta:
        model  = UserAddress
        fields = [
            "id", "full_name", "phone",
            "address_line1", "address_line2",
            "city", "state", "pincode",
            "is_default", "formatted",
        ]


class UserAddressWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserAddress
        fields = [
            "full_name", "phone",
            "address_line1", "address_line2",
            "city", "state", "pincode",
            "is_default",
        ]

    def validate_phone(self, value):
        clean = value.strip().replace(" ", "")
        if not clean.isdigit() or len(clean) not in (10, 12):
            raise serializers.ValidationError(
                "Enter a valid 10-digit mobile number."
            )
        return clean

    def validate_pincode(self, value):
        if not value.strip().isdigit() or len(value.strip()) != 6:
            raise serializers.ValidationError("Enter a valid 6-digit pincode.")
        return value.strip()


# ── Order Item ────────────────────────────────────────────────
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = [
            "id",
            "product_title",
            "variant_detail",
            "quantity",
            "unit_price",
            "line_total",
        ]


# ── Order List (lightweight for history page) ─────────────────
class OrderListSerializer(serializers.ModelSerializer):
    item_count        = serializers.SerializerMethodField()
    status_display    = serializers.CharField(source="get_status_display", read_only=True)
    payment_display   = serializers.CharField(source="get_payment_status_display", read_only=True)

    class Meta:
        model  = Order
        fields = [
            "id", "order_number",
            "status", "status_display",
            "payment_status", "payment_display",
            "total_amount", "item_count",
            "placed_at",
        ]

    def get_item_count(self, obj):
        return obj.items.count()


# ── Order Detail (full, with items + shipping) ────────────────
class OrderDetailSerializer(serializers.ModelSerializer):
    items           = OrderItemSerializer(many=True, read_only=True)
    status_display  = serializers.CharField(source="get_status_display",         read_only=True)
    payment_display = serializers.CharField(source="get_payment_status_display",  read_only=True)
    can_cancel      = serializers.BooleanField(read_only=True)
    shipping_address_full = serializers.CharField(read_only=True)

    class Meta:
        model  = Order
        fields = [
            "id", "order_number",
            "status", "status_display",
            "payment_status", "payment_display",
            "subtotal", "delivery_charge", "total_amount",
            "shipping_name", "shipping_phone",
            "shipping_address_full",
            "shipping_city", "shipping_state", "shipping_pincode",
            "razorpay_order_id",
            "notes", "can_cancel",
            "placed_at", "updated_at",
            "items",
        ]


# ── Place Order input ─────────────────────────────────────────
class PlaceOrderSerializer(serializers.Serializer):
    address_id = serializers.UUIDField(
        help_text="UUID of the saved delivery address"
    )
    notes = serializers.CharField(
        required=False, allow_blank=True, max_length=500,
        help_text="Optional delivery instructions"
    )


# ── Admin: update order status ────────────────────────────────
class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=Order.Status.choices,
        help_text="New order status",
    )