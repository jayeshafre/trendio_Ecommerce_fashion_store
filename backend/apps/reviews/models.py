"""
Reviews Module — Models

Rules:
  - One review per user per product (unique_together)
  - Eligibility checked in service layer (delivered order required)
  - Rating: 1–5 integer
  - Soft fields: title (optional), body (required)
  - Admin can delete any review
  - User can edit/delete their own
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):

    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user    = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="reviews"
    )
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="reviews"
    )

    # ── Content ────────────────────────────────────────────
    rating  = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        db_index=True,
    )
    title   = models.CharField(max_length=150, blank=True)
    body    = models.TextField()

    # ── Timestamps ─────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]
        # One review per user per product — enforced at DB level
        unique_together = [("user", "product")]
        indexes = [
            models.Index(fields=["product", "rating"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.product.title} ({self.rating}★)"