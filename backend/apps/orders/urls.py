"""
Orders URL patterns — all under /api/v1/orders/

Addresses have been moved to the users module (/api/v1/auth/addresses/).
"""
from django.urls import path
from .views import (
    OrderListCreateView, OrderDetailView, OrderCancelView,
    AdminOrderListView, AdminOrderStatusView,
)

app_name = "orders"

urlpatterns = [
    # ── Admin (before <uuid:pk>/) ──────────────────────────
    path("admin/",                  AdminOrderListView.as_view(),   name="admin-order-list"),
    path("admin/<uuid:pk>/status/", AdminOrderStatusView.as_view(), name="admin-order-status"),

    # ── Customer orders ────────────────────────────────────
    path("",                  OrderListCreateView.as_view(), name="order-list"),
    path("<uuid:pk>/",        OrderDetailView.as_view(),     name="order-detail"),
    path("<uuid:pk>/cancel/", OrderCancelView.as_view(),     name="order-cancel"),
]