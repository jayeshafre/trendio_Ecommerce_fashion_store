"""
OrderService — updated to import UserAddress from users module.
Only the import line changed — all logic is identical.
"""
import logging

from django.db import transaction, IntegrityError
from django.db.models import F as models_F
from rest_framework.exceptions import ValidationError

from apps.cart.models import Cart
from apps.cart.services import CartService
from apps.products.models import ProductVariant
from apps.users.models import UserAddress          # ← moved here from orders.models
from .models import Order, OrderItem
from .utils import generate_order_number

logger = logging.getLogger(__name__)

ALLOWED_TRANSITIONS = {
    Order.Status.PENDING:   {Order.Status.CONFIRMED, Order.Status.CANCELLED},
    Order.Status.CONFIRMED: {Order.Status.SHIPPED,   Order.Status.CANCELLED},
    Order.Status.SHIPPED:   {Order.Status.DELIVERED},
    Order.Status.DELIVERED: set(),
    Order.Status.CANCELLED: set(),
}

FREE_DELIVERY_THRESHOLD = 999
FLAT_DELIVERY_CHARGE    = 99


class OrderService:

    @staticmethod
    @transaction.atomic
    def place_order(user, address_id: str, notes: str = "") -> Order:
        """
        Convert a validated cart into a permanent order.
        UserAddress is now fetched from users.UserAddress.
        """

        # Step 1: Fetch cart
        try:
            cart = Cart.objects.prefetch_related(
                "items__variant__product",
                "items__product",
            ).get(user=user)
        except Cart.DoesNotExist:
            raise ValidationError({"cart": "Cart not found. Add items before placing an order."})

        cart_items = list(cart.items.select_related("product", "variant").all())

        # Step 2: Validate cart not empty
        if not cart_items:
            raise ValidationError({"cart": "Your cart is empty."})

        # Step 3: Fetch and validate address (from users module)
        try:
            address = UserAddress.objects.get(id=address_id, user=user)
        except UserAddress.DoesNotExist:
            raise ValidationError({"address_id": "Address not found. Please add a valid delivery address."})

        # Step 4: Lock variant rows
        variant_ids = [item.variant_id for item in cart_items]
        locked_variants = ProductVariant.objects.select_for_update().filter(id__in=variant_ids)
        variant_map = {str(v.id): v for v in locked_variants}

        # Step 5: Stock validation
        stock_errors = []
        for item in cart_items:
            variant = variant_map.get(str(item.variant_id))
            if not variant:
                stock_errors.append({
                    "product": item.product.title,
                    "issue":   "Product variant no longer available.",
                })
            elif variant.stock == 0:
                stock_errors.append({
                    "product": item.product.title,
                    "variant": f"{variant.size} / {variant.color}",
                    "issue":   "Out of stock.",
                })
            elif item.quantity > variant.stock:
                stock_errors.append({
                    "product":   item.product.title,
                    "variant":   f"{variant.size} / {variant.color}",
                    "issue":     "Insufficient stock.",
                    "available": variant.stock,
                    "requested": item.quantity,
                })

        if stock_errors:
            raise ValidationError({
                "stock_errors": stock_errors,
                "detail": "Some items in your cart are out of stock. Please update your cart and try again.",
            })

        # Step 6: Calculate totals
        subtotal        = sum(item.price_at_add * item.quantity for item in cart_items)
        delivery_charge = 0 if subtotal >= FREE_DELIVERY_THRESHOLD else FLAT_DELIVERY_CHARGE
        total_amount    = subtotal + delivery_charge

        # Step 7: Create Order (address snapshot)
        try:
            order_number = generate_order_number()
            order = Order.objects.create(
                user            = user,
                order_number    = order_number,
                status          = Order.Status.PENDING,
                payment_status  = Order.PaymentStatus.UNPAID,
                subtotal        = subtotal,
                delivery_charge = delivery_charge,
                total_amount    = total_amount,
                shipping_name    = address.full_name,
                shipping_phone   = address.phone,
                shipping_address = address.address_line1 + (
                    f", {address.address_line2}" if address.address_line2 else ""
                ),
                shipping_city    = address.city,
                shipping_state   = address.state,
                shipping_pincode = address.pincode,
                notes            = notes,
            )
        except IntegrityError:
            order_number = generate_order_number()
            order = Order.objects.create(
                user            = user,
                order_number    = order_number,
                status          = Order.Status.PENDING,
                payment_status  = Order.PaymentStatus.UNPAID,
                subtotal        = subtotal,
                delivery_charge = delivery_charge,
                total_amount    = total_amount,
                shipping_name    = address.full_name,
                shipping_phone   = address.phone,
                shipping_address = address.address_line1 + (
                    f", {address.address_line2}" if address.address_line2 else ""
                ),
                shipping_city    = address.city,
                shipping_state   = address.state,
                shipping_pincode = address.pincode,
                notes            = notes,
            )

        # Step 8: Create OrderItems
        order_items = []
        for item in cart_items:
            variant = variant_map[str(item.variant_id)]
            variant_detail = " / ".join(filter(None, [variant.size, variant.color])) or "Standard"
            order_items.append(OrderItem(
                order          = order,
                product        = item.product,
                variant        = item.variant,
                product_title  = item.product.title,
                variant_detail = variant_detail,
                quantity       = item.quantity,
                unit_price     = item.price_at_add,
                line_total     = item.price_at_add * item.quantity,
            ))
        OrderItem.objects.bulk_create(order_items)

        # Step 9: Deduct stock
        for item in cart_items:
            variant = variant_map[str(item.variant_id)]
            variant.stock -= item.quantity
            variant.save(update_fields=["stock"])

        # Step 10: Clear cart
        CartService.clear_cart(cart)

        logger.info(
            f"Order placed: {order.order_number} | "
            f"User: {user.email} | Total: ₹{total_amount} | Items: {len(order_items)}"
        )

        return order

    @staticmethod
    @transaction.atomic
    def cancel_order(user, order_id: str) -> Order:
        try:
            order = Order.objects.select_for_update().get(id=order_id, user=user)
        except Order.DoesNotExist:
            raise ValidationError({"order": "Order not found."})

        if not order.can_cancel:
            raise ValidationError({
                "status": f"Orders with status '{order.get_status_display()}' cannot be cancelled."
            })

        items = order.items.select_related("variant").all()
        for item in items:
            if item.variant:
                ProductVariant.objects.filter(id=item.variant_id).update(
                    stock=models_F("stock") + item.quantity
                )

        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status", "updated_at"])

        logger.info(f"Order cancelled: {order.order_number} by {user.email}")

        if order.payment_status == Order.PaymentStatus.PAID:
            logger.info(f"Order {order.order_number} was PAID — refund required.")

        return order

    @staticmethod
    def update_order_status(order_id: str, new_status: str) -> Order:
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            raise ValidationError({"order": "Order not found."})

        current = order.status
        allowed = ALLOWED_TRANSITIONS.get(current, set())

        if new_status not in allowed:
            raise ValidationError({
                "status": f"Cannot transition from '{current}' to '{new_status}'. "
                          f"Allowed: {[s for s in allowed] or 'none (terminal state)'}."
            })

        order.status = new_status
        order.save(update_fields=["status", "updated_at"])

        logger.info(f"Order {order.order_number} status: {current} → {new_status}")

        return order