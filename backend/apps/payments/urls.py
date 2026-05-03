"""
Payments URL patterns — all under /api/v1/payments/

POST   /api/v1/payments/create/    → create Razorpay order
POST   /api/v1/payments/verify/    → verify payment signature
POST   /api/v1/payments/webhook/   → Razorpay server-to-server webhook
GET    /api/v1/payments/           → payment history
"""
from django.urls import path
from .views import (
    CreatePaymentView,
    PaymentListView,
    VerifyPaymentView,
    WebhookView,
)

app_name = "payments"

urlpatterns = [
    path("",         PaymentListView.as_view(),   name="payment-list"),
    path("create/",  CreatePaymentView.as_view(),  name="payment-create"),
    path("verify/",  VerifyPaymentView.as_view(),  name="payment-verify"),
    path("webhook/", WebhookView.as_view(),         name="payment-webhook"),
]