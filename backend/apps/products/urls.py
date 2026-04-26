"""
REPLACE your existing apps/products/urls.py with this file.

Changes from v1:
  - Removed old BulkProductUploadView
  - Added BulkUploadListCreateView, BulkUploadDetailView, BulkUploadErrorReportView
"""
from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView,
    ProductListView, ProductDetailView, ProductSearchView,
    ProductImageListView, ProductImageDeleteView,
    ProductVariantListView, ProductVariantDetailView,
)
from .bulk_upload_view_v2 import (
    BulkUploadListCreateView,
    BulkUploadDetailView,
    BulkUploadErrorReportView,
)

app_name = "products"

urlpatterns = [
    # ── Categories ─────────────────────────────────────────
    path("categories/",        CategoryListView.as_view(),   name="category-list"),
    path("categories/<slug>/", CategoryDetailView.as_view(), name="category-detail"),

    # ── Products ───────────────────────────────────────────
    path("products/",          ProductListView.as_view(),    name="product-list"),
    path("products/search/",   ProductSearchView.as_view(),  name="product-search"),

    # ── Bulk Upload (BEFORE <slug>/ to avoid conflict) ─────
    path("products/bulk-upload/",          BulkUploadListCreateView.as_view(),  name="bulk-upload"),
    path("products/bulk-upload/<pk>/",     BulkUploadDetailView.as_view(),      name="bulk-upload-detail"),
    path("products/bulk-upload/<pk>/errors/", BulkUploadErrorReportView.as_view(), name="bulk-upload-errors"),

    # ── Product detail + management ────────────────────────
    path("products/<slug>/",              ProductDetailView.as_view(),       name="product-detail"),
    path("products/<slug>/images/",       ProductImageListView.as_view(),    name="product-images"),
    path("products/<slug>/images/<pk>/",  ProductImageDeleteView.as_view(),  name="product-image-delete"),
    path("products/<slug>/variants/",     ProductVariantListView.as_view(),  name="product-variants"),
    path("products/<slug>/variants/<pk>/",ProductVariantDetailView.as_view(),name="product-variant-detail"),
]