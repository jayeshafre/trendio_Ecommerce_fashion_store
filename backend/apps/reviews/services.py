"""
ReviewService — all business logic for reviews.

Key rule: user can only review a product they have purchased
and received (order status = delivered).
"""
import logging
from rest_framework.exceptions import ValidationError, PermissionDenied

from apps.orders.models import Order, OrderItem
from apps.products.models import Product
from .models import Review

logger = logging.getLogger(__name__)


class ReviewService:

    @staticmethod
    def _assert_purchased(user, product):
        """
        Raises ValidationError if user has no delivered order
        containing this product.
        """
        has_delivered = OrderItem.objects.filter(
            product=product,
            order__user=user,
            order__status__in=[Order.Status.DELIVERED, Order.Status.SHIPPED],
        ).exists()

        if not has_delivered:
            raise ValidationError({
                "detail": (
                    "You can only review products from delivered orders. "
                    "Complete your purchase and receive the item first."
                )
            })

    @staticmethod
    def create_review(user, product_slug: str, rating: int, body: str, title: str = "") -> Review:
        """
        Creates a review after verifying:
          1. Product exists and is active
          2. User has a delivered order containing this product
          3. User hasn't already reviewed this product
        """
        # 1. Fetch product
        try:
            product = Product.objects.get(slug=product_slug, is_active=True)
        except Product.DoesNotExist:
            raise ValidationError({"detail": "Product not found."})

        # 2. Verify purchase
        ReviewService._assert_purchased(user, product)

        # 3. Check duplicate
        if Review.objects.filter(user=user, product=product).exists():
            raise ValidationError({
                "detail": "You have already reviewed this product. Edit your existing review instead."
            })

        # 4. Create
        review = Review.objects.create(
            user    = user,
            product = product,
            rating  = rating,
            title   = title.strip(),
            body    = body.strip(),
        )

        logger.info(
            f"Review created: {user.email} → {product.title} ({rating}★)"
        )

        return review

    @staticmethod
    def update_review(user, review_id: str, rating: int, body: str, title: str = "") -> Review:
        """
        User can update their own review only.
        """
        try:
            review = Review.objects.get(id=review_id, user=user)
        except Review.DoesNotExist:
            raise ValidationError({"detail": "Review not found or not yours to edit."})

        review.rating = rating
        review.title  = title.strip()
        review.body   = body.strip()
        review.save(update_fields=["rating", "title", "body", "updated_at"])

        logger.info(f"Review updated: {review_id} by {user.email}")
        return review

    @staticmethod
    def delete_review(user, review_id: str, is_admin: bool = False) -> None:
        """
        User can delete their own review.
        Admin can delete any review.
        """
        try:
            if is_admin:
                review = Review.objects.get(id=review_id)
            else:
                review = Review.objects.get(id=review_id, user=user)
        except Review.DoesNotExist:
            raise ValidationError({"detail": "Review not found."})

        product_title = review.product.title
        review.delete()

        logger.info(
            f"Review deleted: {review_id} | "
            f"Product: {product_title} | "
            f"By: {'admin' if is_admin else user.email}"
        )

    @staticmethod
    def can_review(user, product_slug: str) -> dict:
        """
        Returns eligibility info — used by frontend to
        show/hide the review form before the user tries to submit.
        """
        try:
            product = Product.objects.get(slug=product_slug, is_active=True)
        except Product.DoesNotExist:
            return {"can_review": False, "reason": "Product not found."}

        has_delivered = OrderItem.objects.filter(
            product=product,
            order__user=user,
            order__status__in=[Order.Status.DELIVERED, Order.Status.SHIPPED],
        ).exists()

        if not has_delivered:
            return {
                "can_review": False,
                "reason": "Purchase and receive this product first.",
            }

        already_reviewed = Review.objects.filter(
            user=user, product=product
        ).first()

        if already_reviewed:
            return {
                "can_review":  False,
                "reason":      "You have already reviewed this product.",
                "review_id":   str(already_reviewed.id),
                "your_rating": already_reviewed.rating,
            }

        return {"can_review": True}