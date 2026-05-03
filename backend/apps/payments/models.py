"""
Payments Module — Models

One table: Payment
  - One row per payment attempt (including failures)
  - Linked to Order via FK (order can have multiple attempts)
  - Stores Razorpay IDs for full audit trail
  - NEVER stores card/UPI details — Razorpay handles that

Design decisions:
  - Payment is a LOG, not a source of truth for order status
  - Order.payment_status is the source of truth
  - Payment rows are append-only (never update, only create)
  - signature_verified flag proves HMAC check passed
"""
import uuid
from django.db import models
from django.utils import timezone


class Payment(models.Model):

    class Status(models.TextChoices):
        CREATED  = "created",  "Created"    # Razorpay order created, user hasn't paid yet
        SUCCESS  = "success",  "Success"    # Payment captured successfully
        FAILED   = "failed",   "Failed"     # Payment failed / user cancelled
        REFUNDED = "refunded", "Refunded"   # Refund initiated

    # ── Identity ───────────────────────────────────────────────
    id    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="payments",
    )

    # ── Razorpay IDs ───────────────────────────────────────────
    # razorpay_order_id  → created when we call razorpay.order.create()
    # razorpay_payment_id→ returned by Razorpay after user pays
    # razorpay_signature → HMAC-SHA256 of order_id + payment_id
    razorpay_order_id   = models.CharField(max_length=100, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, db_index=True)
    razorpay_signature  = models.CharField(max_length=256, blank=True)

    # ── Status & verification ──────────────────────────────────
    status             = models.CharField(
        max_length=20, choices=Status.choices, default=Status.CREATED, db_index=True
    )
    signature_verified = models.BooleanField(default=False)

    # ── Amount (in paise — Razorpay uses smallest currency unit) ──
    amount_paise = models.PositiveIntegerField()   # e.g. ₹1299 → 129900

    # ── Meta ───────────────────────────────────────────────────
    failure_reason = models.TextField(blank=True)  # Razorpay error description
    created_at     = models.DateTimeField(default=timezone.now)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["order"]),
            models.Index(fields=["razorpay_order_id"]),
            models.Index(fields=["razorpay_payment_id"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return (
            f"Payment({self.order.order_number} | "
            f"{self.status} | ₹{self.amount_paise // 100})"
        )

    @property
    def amount_rupees(self):
        return self.amount_paise / 100