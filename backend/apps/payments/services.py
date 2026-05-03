"""
PaymentService — all Razorpay business logic lives here.

Views are thin; they call service methods only.

Methods:
  create_razorpay_order  → calls Razorpay API, creates Payment row, stores
                           razorpay_order_id on the Order
  verify_payment         → HMAC-SHA256 signature check, marks order PAID +
                           CONFIRMED, updates Payment row
  handle_webhook         → server-to-server webhook from Razorpay (backup)
  get_razorpay_client    → singleton client factory
"""
import hashlib
import hmac
import logging

import razorpay
from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.orders.models import Order
from .models import Payment

logger = logging.getLogger(__name__)


def get_razorpay_client() -> razorpay.Client:
    """
    Returns authenticated Razorpay client.
    Uses TEST keys in dev, LIVE keys in prod — controlled purely by env vars.
    """
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


class PaymentService:

    # ─────────────────────────────────────────────────────────
    # create_razorpay_order
    # ─────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def create_razorpay_order(user, order_id: str) -> dict:
        """
        Step 1 of payment flow.
        Called by frontend after order is placed.

        1. Fetch the Order (must belong to user, must be UNPAID)
        2. Call Razorpay API to create a Razorpay order
        3. Save razorpay_order_id on Order row
        4. Create a Payment row with status=CREATED
        5. Return data needed by frontend to open checkout modal

        Returns:
            {
              "razorpay_order_id": "order_xxx",
              "amount":            129900,       ← paise
              "currency":          "INR",
              "key":               "rzp_test_xxx",
              "order_number":      "TRD-20240812-0042",
              "name":              "Rahul Sharma",
              "email":             "rahul@example.com",
              "contact":           "9876543210",
            }
        """
        # ── Validate order ────────────────────────────────────
        try:
            order = Order.objects.select_for_update().get(
                id=order_id, user=user
            )
        except Order.DoesNotExist:
            raise ValidationError({"order": "Order not found."})

        if order.payment_status == Order.PaymentStatus.PAID:
            raise ValidationError({"order": "This order has already been paid."})

        if order.status == Order.Status.CANCELLED:
            raise ValidationError({"order": "Cannot pay for a cancelled order."})

        # ── Convert to paise (Razorpay uses smallest currency unit) ──
        amount_paise = int(order.total_amount * 100)

        # ── Call Razorpay API ─────────────────────────────────
        client = get_razorpay_client()
        try:
            rz_order = client.order.create({
                "amount":   amount_paise,
                "currency": "INR",
                "receipt":  order.order_number,   # shown in Razorpay dashboard
                "notes": {
                    "order_id":     str(order.id),
                    "order_number": order.order_number,
                },
            })
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            raise ValidationError({"razorpay": "Payment gateway error. Please try again."})

        razorpay_order_id = rz_order["id"]

        # ── Store razorpay_order_id on Order ──────────────────
        order.razorpay_order_id = razorpay_order_id
        order.save(update_fields=["razorpay_order_id", "updated_at"])

        # ── Create Payment row (status=CREATED) ───────────────
        Payment.objects.create(
            order               = order,
            razorpay_order_id   = razorpay_order_id,
            amount_paise        = amount_paise,
            status              = Payment.Status.CREATED,
        )

        logger.info(
            f"Razorpay order created: {razorpay_order_id} "
            f"for order {order.order_number} | ₹{order.total_amount}"
        )

        # ── Return all data frontend needs ────────────────────
        return {
            "razorpay_order_id": razorpay_order_id,
            "amount":            amount_paise,
            "currency":          "INR",
            "key":               settings.RAZORPAY_KEY_ID,
            "order_number":      order.order_number,
            "order_id":          str(order.id),
            # Pre-fill checkout modal
            "name":              order.shipping_name,
            "contact":           order.shipping_phone,
            "email":             user.email,
        }

    # ─────────────────────────────────────────────────────────
    # verify_payment
    # ─────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def verify_payment(
        razorpay_order_id:   str,
        razorpay_payment_id: str,
        razorpay_signature:  str,
    ) -> Order:
        """
        Step 2 of payment flow.
        Called by frontend after user completes Razorpay checkout.

        1. Verify HMAC-SHA256 signature (proves payment is genuine)
        2. Fetch the Payment row
        3. Update Payment → status=SUCCESS, store payment_id + signature
        4. Update Order  → payment_status=PAID, status=CONFIRMED
        5. Return updated Order

        Signature verification:
            expected = HMAC_SHA256(
                key     = RAZORPAY_KEY_SECRET,
                message = f"{razorpay_order_id}|{razorpay_payment_id}"
            )
            if expected != razorpay_signature → FRAUD, reject
        """
        # ── Step 1: HMAC signature verification ───────────────
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_signature = hmac.new(
            key=settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            msg=message.encode("utf-8"),
            digestmod=hashlib.sha256,
        ).hexdigest()

        signature_valid = hmac.compare_digest(
            expected_signature, razorpay_signature
        )

        if not signature_valid:
            logger.warning(
                f"INVALID signature for razorpay_order_id={razorpay_order_id} "
                f"payment_id={razorpay_payment_id}"
            )
            raise ValidationError({
                "signature": "Payment verification failed. Possible fraud attempt."
            })

        # ── Step 2: Fetch Payment row ─────────────────────────
        try:
            payment = Payment.objects.select_for_update().get(
                razorpay_order_id=razorpay_order_id
            )
        except Payment.DoesNotExist:
            raise ValidationError({"payment": "Payment record not found."})

        # Guard: already processed (idempotency)
        if payment.status == Payment.Status.SUCCESS:
            logger.info(f"Payment already verified: {razorpay_payment_id}")
            return payment.order

        # ── Step 3: Update Payment row ────────────────────────
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature  = razorpay_signature
        payment.status              = Payment.Status.SUCCESS
        payment.signature_verified  = True
        payment.save(update_fields=[
            "razorpay_payment_id", "razorpay_signature",
            "status", "signature_verified", "updated_at",
        ])

        # ── Step 4: Update Order ──────────────────────────────
        order = payment.order
        order.payment_status = Order.PaymentStatus.PAID
        order.status         = Order.Status.CONFIRMED   # auto-confirm on payment
        order.save(update_fields=["payment_status", "status", "updated_at"])

        logger.info(
            f"Payment verified: {razorpay_payment_id} | "
            f"Order {order.order_number} → PAID + CONFIRMED"
        )

        # TODO: trigger order confirmation email (Notifications module)
        # send_order_confirmation_email.delay(order.id)

        return order

    # ─────────────────────────────────────────────────────────
    # handle_webhook
    # ─────────────────────────────────────────────────────────
    @staticmethod
    def handle_webhook(payload: bytes, razorpay_signature: str) -> dict:
        """
        Razorpay server-to-server webhook — backup for when frontend
        fails to call /verify/ (user closes browser, network drop, etc.)

        Verifies webhook signature using WEBHOOK_SECRET (different from KEY_SECRET).
        For now: only handles payment.captured event.

        This endpoint must be:
        - Registered in Razorpay Dashboard → Webhooks
        - Set to CSRF exempt (done in views.py)
        - Rate-limited to Razorpay IPs in production (Nginx level)
        """
        webhook_secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "")

        if webhook_secret:
            # Verify webhook signature
            expected = hmac.new(
                key=webhook_secret.encode("utf-8"),
                msg=payload,
                digestmod=hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(expected, razorpay_signature or ""):
                logger.warning("Invalid webhook signature received")
                return {"status": "invalid_signature"}

        import json
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            return {"status": "invalid_payload"}

        event_type = event.get("event", "")
        logger.info(f"Razorpay webhook received: {event_type}")

        if event_type == "payment.captured":
            payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_order_id   = payment_entity.get("order_id", "")
            razorpay_payment_id = payment_entity.get("id", "")

            if not razorpay_order_id or not razorpay_payment_id:
                return {"status": "missing_ids"}

            # Only process if not already marked paid (idempotency)
            try:
                payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
                if payment.status != Payment.Status.SUCCESS:
                    with transaction.atomic():
                        payment.razorpay_payment_id = razorpay_payment_id
                        payment.status              = Payment.Status.SUCCESS
                        payment.save(update_fields=[
                            "razorpay_payment_id", "status", "updated_at"
                        ])

                        order = payment.order
                        order.payment_status = Order.PaymentStatus.PAID
                        order.status         = Order.Status.CONFIRMED
                        order.save(update_fields=["payment_status", "status", "updated_at"])

                        logger.info(
                            f"Webhook: Order {order.order_number} marked PAID via webhook"
                        )
            except Payment.DoesNotExist:
                logger.warning(f"Webhook: No payment found for {razorpay_order_id}")

        elif event_type == "payment.failed":
            payment_entity      = event.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_order_id   = payment_entity.get("order_id", "")
            error_description   = payment_entity.get("error_description", "Payment failed")

            try:
                payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
                if payment.status == Payment.Status.CREATED:
                    payment.status         = Payment.Status.FAILED
                    payment.failure_reason = error_description
                    payment.save(update_fields=["status", "failure_reason", "updated_at"])
                    logger.info(f"Webhook: Payment failed for order {razorpay_order_id}")
            except Payment.DoesNotExist:
                pass

        return {"status": "ok"}