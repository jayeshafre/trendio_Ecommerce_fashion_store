"""
Reviews Views — thin HTTP handlers. All logic in services.py.

Customer endpoints:
  GET    /api/v1/reviews/products/{slug}/          → list reviews for a product
  POST   /api/v1/reviews/products/{slug}/          → create review
  GET    /api/v1/reviews/products/{slug}/eligible/ → check if user can review
  PATCH  /api/v1/reviews/{id}/                     → edit own review
  DELETE /api/v1/reviews/{id}/                     → delete own review
  GET    /api/v1/reviews/mine/                     → all reviews by current user

Admin endpoints:
  GET    /api/v1/reviews/admin/                    → all reviews (paginated)
  DELETE /api/v1/reviews/admin/{id}/               → delete any review
"""
import logging
from rest_framework import permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Review
from .serializers import ReviewSerializer, ReviewWriteSerializer
from .services import ReviewService

logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class ReviewPagination(PageNumberPagination):
    page_size             = 10
    page_size_query_param = "page_size"
    max_page_size         = 50


# ── Product Reviews (list + create) ──────────────────────────
class ProductReviewListCreateView(APIView):
    """
    GET  → public: list all reviews for a product (no auth required)
    POST → authenticated: create a review (verified purchase only)
    """
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @extend_schema(tags=["Reviews"])
    def get(self, request, slug):
        # Optional rating filter: ?rating=5
        rating_filter = request.query_params.get("rating")

        qs = (
            Review.objects
            .filter(product__slug=slug)
            .select_related("user", "product")
            .order_by("-created_at")
        )
        if rating_filter:
            qs = qs.filter(rating=rating_filter)

        paginator = ReviewPagination()
        page      = paginator.paginate_queryset(qs, request)
        serializer = ReviewSerializer(page, many=True)

        # Aggregate stats alongside the list
        all_reviews   = Review.objects.filter(product__slug=slug)
        total         = all_reviews.count()
        avg_rating    = round(
            sum(r.rating for r in all_reviews) / total, 1
        ) if total else 0

        rating_counts = {}
        for r in range(1, 6):
            rating_counts[str(r)] = all_reviews.filter(rating=r).count()

        response = paginator.get_paginated_response(serializer.data)
        response.data["stats"] = {
            "total":        total,
            "avg_rating":   avg_rating,
            "rating_counts": rating_counts,
        }
        return response

    @extend_schema(tags=["Reviews"], request=ReviewWriteSerializer)
    def post(self, request, slug):
        serializer = ReviewWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = ReviewService.create_review(
            user         = request.user,
            product_slug = slug,
            rating       = serializer.validated_data["rating"],
            body         = serializer.validated_data["body"],
            title        = serializer.validated_data.get("title", ""),
        )

        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )


# ── Eligibility check ─────────────────────────────────────────
class ReviewEligibilityView(APIView):
    """
    GET /reviews/products/{slug}/eligible/
    Returns whether the current user can review this product.
    Frontend uses this to show/hide the review form.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Reviews"])
    def get(self, request, slug):
        result = ReviewService.can_review(
            user         = request.user,
            product_slug = slug,
        )
        return Response(result)


# ── Single Review (edit + delete own) ────────────────────────
class ReviewDetailView(APIView):
    """
    PATCH  → user edits their own review
    DELETE → user deletes their own review
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Reviews"], request=ReviewWriteSerializer)
    def patch(self, request, pk):
        serializer = ReviewWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        vd = serializer.validated_data
        review = ReviewService.update_review(
            user      = request.user,
            review_id = str(pk),
            rating    = vd.get("rating"),
            body      = vd.get("body"),
            title     = vd.get("title", ""),
        )

        return Response(ReviewSerializer(review).data)

    @extend_schema(tags=["Reviews"])
    def delete(self, request, pk):
        ReviewService.delete_review(
            user      = request.user,
            review_id = str(pk),
            is_admin  = False,
        )
        return Response(
            {"message": "Review deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


# ── My Reviews ────────────────────────────────────────────────
class MyReviewsView(APIView):
    """
    GET /reviews/mine/
    Returns all reviews written by the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Reviews"])
    def get(self, request):
        reviews = (
            Review.objects
            .filter(user=request.user)
            .select_related("product")
            .order_by("-created_at")
        )
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)


# ── Admin ─────────────────────────────────────────────────────
class AdminReviewListView(APIView):
    """
    GET /reviews/admin/
    All reviews across all products. Supports ?product_slug= and ?rating= filters.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(tags=["Reviews | Admin"])
    def get(self, request):
        qs = (
            Review.objects
            .select_related("user", "product")
            .order_by("-created_at")
        )

        product_slug = request.query_params.get("product_slug")
        rating       = request.query_params.get("rating")

        if product_slug:
            qs = qs.filter(product__slug=product_slug)
        if rating:
            qs = qs.filter(rating=rating)

        paginator = ReviewPagination()
        page      = paginator.paginate_queryset(qs, request)
        serializer = ReviewSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminReviewDeleteView(APIView):
    """
    DELETE /reviews/admin/{id}/
    Admin deletes any review without restriction.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(tags=["Reviews | Admin"])
    def delete(self, request, pk):
        ReviewService.delete_review(
            user      = request.user,
            review_id = str(pk),
            is_admin  = True,
        )
        return Response(
            {"message": "Review deleted by admin."},
            status=status.HTTP_204_NO_CONTENT,
        )