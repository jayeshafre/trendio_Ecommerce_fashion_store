"""
Cart serializers.

CartItemSerializer  → one item row (product + variant + qty + totals)
CartSerializer      → full cart (items + subtotal + item_count)
AddItemSerializer   → input validation for POST /cart/items/
UpdateQtySerializer → input validation for PUT /cart/items/{id}/
"""
from decimal import Decimal
from rest_framework import serializers
from .models import Cart, CartItem


# ── Nested product info (lightweight) ────────────────────────
class CartProductSerializer(serializers.Serializer):
    id    = serializers.UUIDField()
    title = serializers.CharField()
    slug  = serializers.SlugField()
    brand = serializers.CharField()
    primary_image = serializers.CharField(allow_null=True)


# ── Nested variant info ────────────────────────────────────
class CartVariantSerializer(serializers.Serializer):
    id        = serializers.UUIDField()
    size      = serializers.CharField()
    color     = serializers.CharField()
    color_hex = serializers.CharField()
    stock     = serializers.IntegerField()


# ── CartItem ──────────────────────────────────────────────────
class CartItemSerializer(serializers.ModelSerializer):
    product      = CartProductSerializer(read_only=True)
    variant      = CartVariantSerializer(read_only=True)
    line_total   = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock_warning = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model  = CartItem
        fields = [
            "id", "product", "variant",
            "quantity", "price_at_add",
            "line_total", "stock_warning",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Embed live product data
        p = instance.product
        v = instance.variant
        data["product"] = {
            "id":            str(p.id),
            "title":         p.title,
            "slug":          p.slug,
            "brand":         p.brand,
            "primary_image": p.primary_image,
        }
        data["variant"] = {
            "id":        str(v.id),
            "size":      v.size,
            "color":     v.color,
            "color_hex": v.color_hex,
            "stock":     v.stock,
        }
        return data


# ── Full Cart ─────────────────────────────────────────────────
class CartSerializer(serializers.ModelSerializer):
    items      = CartItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    subtotal   = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = Cart
        fields = ["id", "item_count", "subtotal", "items"]


# ── Add item input ────────────────────────────────────────────
class AddItemSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    quantity   = serializers.IntegerField(min_value=1, max_value=CartItem.MAX_QUANTITY, default=1)


# ── Update quantity input ─────────────────────────────────────
class UpdateQtySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0, max_value=CartItem.MAX_QUANTITY)
    # quantity=0 means remove