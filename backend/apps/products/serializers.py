"""
Products serializers.

List vs Detail pattern:
  ProductListSerializer  → lightweight, used in grid view
  ProductDetailSerializer → full data, used in product page
"""
from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductImage


# ── Category ──────────────────────────────────────────────────────────────────
class CategorySerializer(serializers.ModelSerializer):
    children_count = serializers.SerializerMethodField()
    full_path      = serializers.CharField(read_only=True)

    class Meta:
        model  = Category
        fields = ["id", "name", "slug", "image", "full_path", "children_count"]

    def get_children_count(self, obj):
        return obj.children.filter(is_active=True).count()


class CategoryDetailSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    parent   = CategorySerializer(read_only=True)

    class Meta:
        model  = Category
        fields = ["id", "name", "slug", "image", "parent", "children"]

    def get_children(self, obj):
        qs = obj.children.filter(is_active=True)
        return CategorySerializer(qs, many=True).data


# ── Admin — Category write ────────────────────────────────────────────────────
class CategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "name", "slug", "parent", "image", "is_active"]
        extra_kwargs = {"slug": {"required": False}}

    def validate_name(self, value):
        return value.strip()


# ── Product Images ────────────────────────────────────────────────────────────
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "order"]


class ProductImageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ["image", "alt_text", "is_primary", "order"]


# ── Product Variants ──────────────────────────────────────────────────────────
class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model  = ProductVariant
        fields = [
            "id", "size", "color", "color_hex",
            "sku", "price", "effective_price", "stock", "is_active",
        ]


class ProductVariantWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductVariant
        fields = ["size", "color", "color_hex", "sku", "price", "stock", "is_active"]

    def validate_sku(self, value):
        sku = value.strip().upper()
        # On update, exclude self
        qs = ProductVariant.objects.filter(sku=sku)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This SKU is already taken.")
        return sku


# ── Product List (lightweight) ────────────────────────────────────────────────
class ProductListSerializer(serializers.ModelSerializer):
    category        = CategorySerializer(read_only=True)
    primary_image   = serializers.CharField(read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent= serializers.IntegerField(read_only=True)
    is_in_stock     = serializers.BooleanField(read_only=True)
    # Available sizes and colors for quick display on card
    available_sizes  = serializers.SerializerMethodField()
    available_colors = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            "id", "title", "slug", "brand", "category",
            "base_price", "sale_price", "effective_price", "discount_percent",
            "primary_image", "is_in_stock",
            "available_sizes", "available_colors",
        ]

    def get_available_sizes(self, obj):
        return list(
            obj.variants.filter(is_active=True, stock__gt=0)
            .values_list("size", flat=True)
            .distinct()
        )

    def get_available_colors(self, obj):
        return list(
            obj.variants.filter(is_active=True, stock__gt=0)
            .values("color", "color_hex")
            .distinct()
        )


# ── Product Detail (full) ─────────────────────────────────────────────────────
class ProductDetailSerializer(serializers.ModelSerializer):
    category        = CategorySerializer(read_only=True)
    images          = ProductImageSerializer(many=True, read_only=True)
    variants        = ProductVariantSerializer(many=True, read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent= serializers.IntegerField(read_only=True)
    is_in_stock     = serializers.BooleanField(read_only=True)
    total_stock     = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Product
        fields = [
            "id", "title", "slug", "description", "brand", "category",
            "base_price", "sale_price", "effective_price", "discount_percent",
            "images", "variants",
            "is_in_stock", "total_stock",
            "is_active", "created_at",
        ]


# ── Admin — Product write ─────────────────────────────────────────────────────
class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = [
            "title", "slug", "description", "brand",
            "category", "base_price", "sale_price", "is_active",
        ]
        extra_kwargs = {"slug": {"required": False}}

    def validate(self, attrs):
        sale = attrs.get("sale_price")
        base = attrs.get("base_price") or (self.instance.base_price if self.instance else None)
        if sale and base and sale >= base:
            raise serializers.ValidationError(
                {"sale_price": "Sale price must be less than base price."}
            )
        return attrs