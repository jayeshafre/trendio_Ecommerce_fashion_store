"""
NotificationService — creates in-app notifications.

Called from orders/services.py and payments/services.py
after each key event. All calls wrapped in try/except so
a notification failure never breaks the main operation.

Usage (from other services):
    from apps.notifications.services import NotificationService
    NotificationService.order_placed(order)
    NotificationService.order_status_changed(order, new_status)
    NotificationService.payment_success(order)
    NotificationService.payment_failed(order)
"""
import logging
from .models import Notification

logger = logging.getLogger(__name__)


# ── Message templates ─────────────────────────────────────────
TEMPLATES = {
    Notification.Type.ORDER_PLACED: {
        "title":   "Order Placed 🛍️",
        "message": "Your order {order_number} has been placed successfully for ₹{amount}. We'll confirm it shortly.",
    },
    Notification.Type.ORDER_CONFIRMED: {
        "title":   "Order Confirmed ✅",
        "message": "Great news! Your order {order_number} has been confirmed and is being prepared.",
    },
    Notification.Type.ORDER_SHIPPED: {
        "title":   "Order Shipped 🚚",
        "message": "Your order {order_number} is on its way! You'll receive it soon.",
    },
    Notification.Type.ORDER_DELIVERED: {
        "title":   "Order Delivered 🎉",
        "message": "Your order {order_number} has been delivered. Enjoy your purchase!",
    },
    Notification.Type.ORDER_CANCELLED: {
        "title":   "Order Cancelled",
        "message": "Your order {order_number} has been cancelled. If you paid online, a refund will be processed.",
    },
    Notification.Type.PAYMENT_SUCCESS: {
        "title":   "Payment Successful 💳",
        "message": "Payment of ₹{amount} received for order {order_number}. Your order is now confirmed.",
    },
    Notification.Type.PAYMENT_FAILED: {
        "title":   "Payment Failed ⚠️",
        "message": "Payment for order {order_number} could not be processed. Please try again.",
    },
}

# Maps order status → notification type
STATUS_TYPE_MAP = {
    "confirmed": Notification.Type.ORDER_CONFIRMED,
    "shipped":   Notification.Type.ORDER_SHIPPED,
    "delivered": Notification.Type.ORDER_DELIVERED,
    "cancelled": Notification.Type.ORDER_CANCELLED,
}


def _create(user, notif_type, order):
    """Internal helper — formats template and creates notification."""
    template = TEMPLATES.get(notif_type)
    if not template:
        return

    context = {
        "order_number": order.order_number,
        "amount":       f"{order.total_amount:,.0f}",
    }

    Notification.objects.create(
        user     = user,
        type     = notif_type,
        title    = template["title"],
        message  = template["message"].format(**context),
        order_id = order.id,
    )

    logger.info(
        f"Notification created: {notif_type} | "
        f"User: {user.email} | Order: {order.order_number}"
    )


class NotificationService:

    @staticmethod
    def order_placed(order) -> None:
        try:
            _create(order.user, Notification.Type.ORDER_PLACED, order)
        except Exception as e:
            logger.error(f"Failed to create order_placed notification: {e}")

    @staticmethod
    def order_status_changed(order, new_status: str) -> None:
        """
        Called after admin updates order status.
        Maps status string → notification type automatically.
        """
        notif_type = STATUS_TYPE_MAP.get(new_status)
        if not notif_type:
            return  # PENDING has no notification
        try:
            _create(order.user, notif_type, order)
        except Exception as e:
            logger.error(f"Failed to create status notification ({new_status}): {e}")

    @staticmethod
    def payment_success(order) -> None:
        try:
            _create(order.user, Notification.Type.PAYMENT_SUCCESS, order)
        except Exception as e:
            logger.error(f"Failed to create payment_success notification: {e}")

    @staticmethod
    def payment_failed(order) -> None:
        try:
            _create(order.user, Notification.Type.PAYMENT_FAILED, order)
        except Exception as e:
            logger.error(f"Failed to create payment_failed notification: {e}")

    @staticmethod
    def order_cancelled(order) -> None:
        try:
            _create(order.user, Notification.Type.ORDER_CANCELLED, order)
        except Exception as e:
            logger.error(f"Failed to create order_cancelled notification: {e}")