"""
Products Admin — inline variants and images for efficient management.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, ProductVariant, ProductImage


class CategoryInline(admin.TabularInline):
    model  = Category
    fields = ["name", "slug", "is_active"]
    extra  = 0
    fk_name = "parent"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ["name", "slug", "parent", "is_active"]
    list_filter   = ["is_active", "parent"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [CategoryInline]


class ProductImageInline(admin.TabularInline):
    model  = ProductImage
    fields = ["image", "image_preview", "alt_text", "is_primary", "order"]
    readonly_fields = ["image_preview"]
    extra  = 1

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" height="50"/>', obj.image.url)
        return "—"
    image_preview.short_description = "Preview"


class ProductVariantInline(admin.TabularInline):
    model  = ProductVariant
    fields = ["size", "color", "color_hex", "sku", "price", "stock", "is_active"]
    extra  = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display   = [
        "title", "brand", "category", "base_price", "sale_price",
        "total_stock_display", "is_active", "created_at",
    ]
    list_filter    = ["is_active", "category", "brand"]
    search_fields  = ["title", "brand", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields     = ["id", "created_at", "updated_at", "discount_percent"]
    inlines = [ProductImageInline, ProductVariantInline]
    fieldsets = (
        ("Basic Info",   {"fields": ("id", "title", "slug", "brand", "category", "description")}),
        ("Pricing",      {"fields": ("base_price", "sale_price", "discount_percent")}),
        ("Status",       {"fields": ("is_active", "created_at", "updated_at")}),
    )

    def total_stock_display(self, obj):
        stock = obj.total_stock
        color = "#22c55e" if stock > 0 else "#D97757"
        return format_html('<span style="color:{}; font-weight:600;">{}</span>', color, stock)
    total_stock_display.short_description = "Stock"


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display  = ["product", "size", "color", "sku", "stock", "is_active"]
    list_filter   = ["is_active", "size", "color"]
    search_fields = ["sku", "product__title"]