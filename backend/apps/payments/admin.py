"""
Payments Admin — full visibility into payment transactions.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = [
        "order_number_display", "amount_display", "status_badge",
        "signature_verified", "razorpay_payment_id", "created_at",
    ]
    list_filter   = ["status", "signature_verified", "created_at"]
    search_fields = [
        "order__order_number",
        "razorpay_order_id",
        "razorpay_payment_id",
        "order__user__email",
    ]
    readonly_fields = [
        "id", "order", "razorpay_order_id", "razorpay_payment_id",
        "razorpay_signature", "amount_paise", "signature_verified",
        "created_at", "updated_at",
    ]
    ordering = ["-created_at"]

    fieldsets = (
        ("Order",     {"fields": ("id", "order")}),
        ("Razorpay",  {"fields": (
            "razorpay_order_id", "razorpay_payment_id", "razorpay_signature"
        )}),
        ("Status",    {"fields": ("status", "signature_verified", "failure_reason")}),
        ("Amount",    {"fields": ("amount_paise",)}),
        ("Timestamps",{"fields": ("created_at", "updated_at")}),
    )

    def order_number_display(self, obj):
        return obj.order.order_number
    order_number_display.short_description = "Order"

    def amount_display(self, obj):
        return f"₹{obj.amount_rupees:,.2f}"
    amount_display.short_description = "Amount"

    def status_badge(self, obj):
        colors = {
            "created":  "#C2A98A",
            "success":  "#84cc16",
            "failed":   "#D97757",
            "refunded": "#2563eb",
        }
        color = colors.get(obj.status, "#7A6E67")
        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            color,
            obj.get_status_display(),
        )
    status_badge.short_description = "Status"