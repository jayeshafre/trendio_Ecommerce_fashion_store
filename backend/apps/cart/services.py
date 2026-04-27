"""
CartService — all cart business logic lives here.

Views are thin HTTP handlers. Services own the logic.
This means: checkout (Orders module) can call CartService
without duplicating any cart rules.

Rules enforced here:
  - Stock validation on every add/update
  - MAX_QUANTITY cap (10 per item)
  - Price always read from DB — never from frontend
  - Quantity 0 on update → delete the item
"""
import logging
from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.products.models import ProductVariant
from .models import Cart, CartItem

logger = logging.getLogger(__name__)


class CartService:

    # ── Get or create cart ────────────────────────────────────
    @staticmethod
    def get_or_create_cart(user) -> Cart:
        cart, created = Cart.objects.get_or_create(user=user)
        if created:
            logger.info(f"New cart created for {user.email}")
        return cart

    # ── Add item ──────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def add_item(cart: Cart, variant_id: str, quantity: int) -> CartItem:
        """
        Add a variant to the cart.
        If variant already in cart: increment quantity.
        Validates stock and MAX_QUANTITY cap.
        Price is always read from the DB (never trusted from frontend).
        """
        if quantity < 1:
            raise ValidationError({"quantity": "Quantity must be at least 1."})

        # Lock the variant row to prevent race conditions
        try:
            variant = ProductVariant.objects.select_for_update().get(
                id=variant_id, is_active=True
            )
        except ProductVariant.DoesNotExist:
            raise ValidationError({"variant_id": "Product variant not found or unavailable."})

        if variant.stock == 0:
            raise ValidationError({
                "stock": f'"{variant.product.title} / {variant.size} {variant.color}" is out of stock.'
            })

        existing = cart.items.filter(variant=variant).first()

        if existing:
            new_qty = existing.quantity + quantity
            # Cap check
            if new_qty > CartItem.MAX_QUANTITY:
                raise ValidationError({
                    "quantity": f"Maximum {CartItem.MAX_QUANTITY} units per item."
                })
            # Stock check
            if new_qty > variant.stock:
                raise ValidationError({
                    "stock": f"Only {variant.stock} unit(s) available. "
                             f"You already have {existing.quantity} in your cart."
                })
            existing.quantity = new_qty
            existing.save(update_fields=["quantity"])
            logger.info(f"Cart item updated: {variant} × {new_qty} (user: {cart.user.email})")
            return existing
        else:
            # New item — snapshot price from DB
            if quantity > CartItem.MAX_QUANTITY:
                raise ValidationError({
                    "quantity": f"Maximum {CartItem.MAX_QUANTITY} units per item."
                })
            if quantity > variant.stock:
                raise ValidationError({
                    "stock": f"Only {variant.stock} unit(s) available for "
                             f'"{variant.product.title} / {variant.size} {variant.color}".'
                })
            price = variant.effective_price
            item = CartItem.objects.create(
                cart         = cart,
                product      = variant.product,
                variant      = variant,
                quantity     = quantity,
                price_at_add = price,
            )
            logger.info(f"Cart item added: {variant} × {quantity} @ ₹{price} (user: {cart.user.email})")
            return item

    # ── Update quantity ───────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def update_qty(cart: Cart, item_id: str, quantity: int) -> CartItem | None:
        """
        Update quantity of an existing cart item.
        quantity == 0 → removes the item (returns None).
        """
        try:
            item = CartItem.objects.select_for_update().get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            raise ValidationError({"item": "Cart item not found."})

        if quantity <= 0:
            item.delete()
            logger.info(f"Cart item deleted (qty=0): {item} (user: {cart.user.email})")
            return None

        if quantity > CartItem.MAX_QUANTITY:
            raise ValidationError({
                "quantity": f"Maximum {CartItem.MAX_QUANTITY} units per item."
            })

        # Re-read variant stock (may have changed since item was added)
        variant = ProductVariant.objects.select_for_update().get(id=item.variant_id)
        if quantity > variant.stock:
            raise ValidationError({
                "stock": f"Only {variant.stock} unit(s) available."
            })

        item.quantity = quantity
        item.save(update_fields=["quantity"])
        logger.info(f"Cart item qty updated: {item.variant} × {quantity} (user: {cart.user.email})")
        return item

    # ── Remove item ───────────────────────────────────────────
    @staticmethod
    def remove_item(cart: Cart, item_id: str) -> None:
        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            raise ValidationError({"item": "Cart item not found."})
        item.delete()
        logger.info(f"Cart item removed: {item_id} (user: {cart.user.email})")

    # ── Clear cart ────────────────────────────────────────────
    @staticmethod
    def clear_cart(cart: Cart) -> None:
        count = cart.items.all().delete()[0]
        logger.info(f"Cart cleared: {count} items removed (user: {cart.user.email})")

    # ── Get summary ───────────────────────────────────────────
    @staticmethod
    def get_summary(cart: Cart) -> dict:
        """
        Returns structured cart summary.
        Called by both CartSerializer and Orders module at checkout.
        """
        items = cart.items.select_related(
            "product", "variant"
        ).all()

        return {
            "id":         str(cart.id),
            "item_count": sum(i.quantity for i in items),
            "subtotal":   sum(i.line_total for i in items),
            "items":      items,
        }

    # ── Validate cart for checkout ────────────────────────────
    @staticmethod
    def validate_for_checkout(cart: Cart) -> list[dict]:
        """
        Called by Orders module before creating an order.
        Returns list of validation errors (empty = all clear).
        Each error: { item_id, variant, issue }
        """
        errors = []
        items  = cart.items.select_related("variant", "product").all()

        if not items:
            errors.append({"issue": "Cart is empty."})
            return errors

        for item in items:
            variant = item.variant
            if variant.stock == 0:
                errors.append({
                    "item_id": str(item.id),
                    "product": item.product.title,
                    "variant": f"{variant.size} / {variant.color}",
                    "issue":   "out_of_stock",
                })
            elif item.quantity > variant.stock:
                errors.append({
                    "item_id":   str(item.id),
                    "product":   item.product.title,
                    "variant":   f"{variant.size} / {variant.color}",
                    "issue":     "insufficient_stock",
                    "available": variant.stock,
                    "requested": item.quantity,
                })

        return errors