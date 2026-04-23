"""
Root URL configuration for Trendio.
All app-level URLs are namespaced and versioned under /api/v1/
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # ─── Django Admin ──────────────────────────────────────
    path("admin/", admin.site.urls),

    # ─── API v1 ────────────────────────────────────────────
    path("api/v1/auth/",     include("apps.users.urls", namespace="users")),
    path("api/v1/", include("apps.products.urls", namespace="products")),

    # Future modules (keep like this)
    # path("api/v1/cart/",     include("apps.cart.urls", namespace="cart")),
    # path("api/v1/orders/",   include("apps.orders.urls", namespace="orders")),
    # path("api/v1/payments/", include("apps.payments.urls", namespace="payments")),

    # ─── API Docs ──────────────────────────────────────────
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/",   SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/",  SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# ─── Static & Media (dev only) ─────────────────────────────
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    import debug_toolbar
    urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns