from django.contrib import admin
from django.utils.html import format_html
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model        = CartItem
    extra        = 0
    readonly_fields = ["product", "variant", "quantity", "price_at_add", "line_total_display"]
    can_delete   = True

    def line_total_display(self, obj):
        return f"₹{obj.line_total:,.2f}"
    line_total_display.short_description = "Line Total"


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display  = ["user", "item_count_display", "subtotal_display", "updated_at"]
    search_fields = ["user__email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [CartItemInline]

    def item_count_display(self, obj):
        return obj.item_count
    item_count_display.short_description = "Items"

    def subtotal_display(self, obj):
        return f"₹{obj.subtotal:,.2f}"
    subtotal_display.short_description = "Subtotal"


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display  = ["product", "variant_display", "quantity", "price_at_add", "cart_user"]
    search_fields = ["product__title", "cart__user__email"]
    readonly_fields = ["id", "price_at_add", "created_at"]

    def variant_display(self, obj):
        return f"{obj.variant.size} / {obj.variant.color}"
    variant_display.short_description = "Variant"

    def cart_user(self, obj):
        return obj.cart.user.email
    cart_user.short_description = "User"