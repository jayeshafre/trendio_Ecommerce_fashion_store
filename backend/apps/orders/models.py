"""
Orders Module — Models

UserAddress has moved to the users module.
Orders still snapshot address fields — no FK to UserAddress.
The place_order service now fetches UserAddress from users.UserAddress.
"""
import uuid
from django.db import models
from django.utils import timezone


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        SHIPPED   = "shipped",   "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID   = "unpaid",   "Unpaid"
        PAID     = "paid",     "Paid"
        REFUNDED = "refunded", "Refunded"

    # ── Identity ───────────────────────────────────────────────
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(
        "users.User", on_delete=models.PROTECT, related_name="orders"
    )
    order_number = models.CharField(max_length=25, unique=True, db_index=True)

    # ── Status ─────────────────────────────────────────────────
    status         = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID, db_index=True
    )

    # ── Financials ─────────────────────────────────────────────
    subtotal        = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount    = models.DecimalField(max_digits=10, decimal_places=2)

    # ── Address SNAPSHOT ──────────────────────────────────────
    shipping_name    = models.CharField(max_length=150)
    shipping_phone   = models.CharField(max_length=15)
    shipping_address = models.CharField(max_length=255)
    shipping_city    = models.CharField(max_length=100)
    shipping_state   = models.CharField(max_length=100)
    shipping_pincode = models.CharField(max_length=10)

    # ── Payment integration ────────────────────────────────────
    razorpay_order_id = models.CharField(max_length=100, blank=True)

    # ── Misc ───────────────────────────────────────────────────
    notes      = models.TextField(blank=True)
    placed_at  = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ["-placed_at"]
        indexes  = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["payment_status"]),
            models.Index(fields=["placed_at"]),
        ]

    def __str__(self):
        return f"{self.order_number} — {self.user.email} ({self.status})"

    @property
    def can_cancel(self):
        return self.status in (self.Status.PENDING, self.Status.CONFIRMED)

    @property
    def shipping_address_full(self):
        return f"{self.shipping_address}, {self.shipping_city}, {self.shipping_state} — {self.shipping_pincode}"


class OrderItem(models.Model):
    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order   = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")

    product = models.ForeignKey(
        "products.Product", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="order_items"
    )
    variant = models.ForeignKey(
        "products.ProductVariant", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="order_items"
    )

    # SNAPSHOTS
    product_title  = models.CharField(max_length=255)
    variant_detail = models.CharField(max_length=100)
    quantity       = models.PositiveIntegerField()
    unit_price     = models.DecimalField(max_digits=10, decimal_places=2)
    line_total     = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_items"
        indexes  = [
            models.Index(fields=["order"]),
            models.Index(fields=["variant"]),
        ]

    def __str__(self):
        return f"{self.product_title} / {self.variant_detail} × {self.quantity}"