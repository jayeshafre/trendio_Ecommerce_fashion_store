"""
Auth URL patterns — all under /api/v1/auth/

Address endpoints now live here (users module owns addresses):
    GET    /api/v1/auth/addresses/
    POST   /api/v1/auth/addresses/
    GET    /api/v1/auth/addresses/{id}/
    PATCH  /api/v1/auth/addresses/{id}/
    DELETE /api/v1/auth/addresses/{id}/
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AddressDetailView,
    AddressListCreateView,
    ChangePasswordView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    MeView,
    OTPSendView,
    OTPVerifyView,
    RegisterView,
    ResetPasswordView,
)

app_name = "users"

urlpatterns = [
    # ── Core Auth ──────────────────────────────────────────
    path("register/",        RegisterView.as_view(),     name="register"),
    path("login/",           LoginView.as_view(),         name="login"),
    path("logout/",          LogoutView.as_view(),         name="logout"),
    path("token/refresh/",   TokenRefreshView.as_view(),  name="token-refresh"),
    path("me/",              MeView.as_view(),             name="me"),

    # ── Addresses ──────────────────────────────────────────
    path("addresses/",           AddressListCreateView.as_view(), name="address-list"),
    path("addresses/<uuid:pk>/", AddressDetailView.as_view(),     name="address-detail"),

    # ── OTP ────────────────────────────────────────────────
    path("otp/send/",        OTPSendView.as_view(),       name="otp-send"),
    path("otp/verify/",      OTPVerifyView.as_view(),     name="otp-verify"),

    # ── Password ───────────────────────────────────────────
    path("password/forgot/", ForgotPasswordView.as_view(), name="password-forgot"),
    path("password/reset/",  ResetPasswordView.as_view(),  name="password-reset"),
    path("password/change/", ChangePasswordView.as_view(), name="password-change"),
]