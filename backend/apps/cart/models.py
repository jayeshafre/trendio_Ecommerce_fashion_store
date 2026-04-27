"""
Cart Module — Models

Cart:     one per authenticated user (unique constraint on user)
CartItem: one row per variant in the cart
          unique constraint on (cart, variant) prevents duplicates

price_at_add: snapshot at add-time. Correct UX: user sees the price
              they saw when they added the item, even if admin changes it.
              Price is revalidated at checkout.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator


class Cart(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="cart",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carts"

    def __str__(self):
        return f"Cart({self.user.email})"

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(item.line_total for item in self.items.all())


class CartItem(models.Model):
    MAX_QUANTITY = 10  # hard cap per item

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart         = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product      = models.ForeignKey("products.Product",        on_delete=models.CASCADE)
    variant      = models.ForeignKey("products.ProductVariant", on_delete=models.CASCADE)
    quantity     = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )
    # Price snapshot — never changes after item is added
    price_at_add = models.DecimalField(max_digits=10, decimal_places=2)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cart_items"
        # One row per variant per cart
        unique_together = [("cart", "variant")]
        indexes = [
            models.Index(fields=["cart"]),
            models.Index(fields=["variant"]),
        ]

    def __str__(self):
        return f"{self.product.title} × {self.quantity} (Cart: {self.cart.user.email})"

    @property
    def line_total(self):
        return self.price_at_add * self.quantity

    @property
    def is_available(self):
        """Check if requested qty is still in stock."""
        return self.variant.stock >= self.quantity

    @property
    def stock_warning(self):
        """Returns a warning if stock is low."""
        if self.variant.stock == 0:
            return "out_of_stock"
        if self.variant.stock < self.quantity:
            return "insufficient_stock"
        if self.variant.stock <= 5:
            return "low_stock"
        return None