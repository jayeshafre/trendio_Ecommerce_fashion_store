"""
Notifications Module — Models

In-app notifications stored in DB.
Triggers: order placed, status changed, payment success/failed.
"""
import uuid
from django.db import models


class Notification(models.Model):

    class Type(models.TextChoices):
        ORDER_PLACED    = "order_placed",    "Order Placed"
        ORDER_CONFIRMED = "order_confirmed", "Order Confirmed"
        ORDER_SHIPPED   = "order_shipped",   "Order Shipped"
        ORDER_DELIVERED = "order_delivered", "Order Delivered"
        ORDER_CANCELLED = "order_cancelled", "Order Cancelled"
        PAYMENT_SUCCESS = "payment_success", "Payment Successful"
        PAYMENT_FAILED  = "payment_failed",  "Payment Failed"

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="notifications"
    )

    # ── Content ────────────────────────────────────────────
    type       = models.CharField(max_length=30, choices=Type.choices, db_index=True)
    title      = models.CharField(max_length=150)
    message    = models.TextField()

    # ── Reference (optional deep-link data) ───────────────
    order_id   = models.UUIDField(null=True, blank=True, db_index=True)

    # ── State ──────────────────────────────────────────────
    is_read    = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} | {self.type} | {'read' if self.is_read else 'unread'}"