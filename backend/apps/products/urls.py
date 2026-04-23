"""
Products URL patterns — all under /api/v1/
"""

from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView,
    ProductListView, ProductDetailView, ProductSearchView,
    ProductImageListView, ProductImageDeleteView,
    ProductVariantListView, ProductVariantDetailView,
    BulkProductUploadView,
)

app_name = "products"

urlpatterns = [
    # ── Categories ─────────────────────────────────────────
    path("categories/",        CategoryListView.as_view(),   name="category-list"),
    path("categories/<slug>/", CategoryDetailView.as_view(), name="category-detail"),

    # ── Products ───────────────────────────────────────────
    path("products/",            ProductListView.as_view(),     name="product-list"),
    path("products/search/",     ProductSearchView.as_view(),   name="product-search"),

    path("products/bulk-upload/", BulkProductUploadView.as_view(), name="product-bulk-upload"),

    path("products/<slug>/",     ProductDetailView.as_view(),   name="product-detail"),

    # ── Product Images ─────────────────────────────────────
    path("products/<slug>/images/",      ProductImageListView.as_view(),   name="product-images"),
    path("products/<slug>/images/<pk>/", ProductImageDeleteView.as_view(), name="product-image-delete"),

    # ── Product Variants ───────────────────────────────────
    path("products/<slug>/variants/",      ProductVariantListView.as_view(),   name="product-variants"),
    path("products/<slug>/variants/<pk>/", ProductVariantDetailView.as_view(), name="product-variant-detail"),
]