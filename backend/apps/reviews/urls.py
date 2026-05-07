"""
Reviews URL patterns — all under /api/v1/reviews/

GET    /reviews/products/{slug}/          → list reviews for product (public)
POST   /reviews/products/{slug}/          → create review (auth + verified purchase)
GET    /reviews/products/{slug}/eligible/ → can current user review? (auth)
PATCH  /reviews/{id}/                     → edit own review
DELETE /reviews/{id}/                     → delete own review
GET    /reviews/mine/                     → all my reviews
GET    /reviews/admin/                    → all reviews (admin)
DELETE /reviews/admin/{id}/               → admin delete any review
"""
from django.urls import path
from .views import (
    ProductReviewListCreateView,
    ReviewEligibilityView,
    ReviewDetailView,
    MyReviewsView,
    AdminReviewListView,
    AdminReviewDeleteView,
)

app_name = "reviews"

urlpatterns = [
    # ── Admin (before generic routes) ─────────────────────
    path("admin/",          AdminReviewListView.as_view(),  name="admin-review-list"),
    path("admin/<uuid:pk>/",AdminReviewDeleteView.as_view(),name="admin-review-delete"),

    # ── Customer ───────────────────────────────────────────
    path("mine/",                           MyReviewsView.as_view(),              name="my-reviews"),
    path("<uuid:pk>/",                      ReviewDetailView.as_view(),           name="review-detail"),
    path("products/<slug:slug>/",           ProductReviewListCreateView.as_view(),name="product-reviews"),
    path("products/<slug:slug>/eligible/",  ReviewEligibilityView.as_view(),      name="review-eligible"),
]