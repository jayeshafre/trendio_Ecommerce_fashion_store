"""
Auth URL patterns — all under /api/v1/auth/
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
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
    path("register/",           RegisterView.as_view(),      name="register"),
    path("login/",              LoginView.as_view(),          name="login"),
    path("logout/",             LogoutView.as_view(),         name="logout"),
    path("token/refresh/",      TokenRefreshView.as_view(),   name="token-refresh"),
    path("me/",                 MeView.as_view(),             name="me"),

    # ── OTP ────────────────────────────────────────────────
    path("otp/send/",           OTPSendView.as_view(),        name="otp-send"),
    path("otp/verify/",         OTPVerifyView.as_view(),      name="otp-verify"),

    # ── Password ───────────────────────────────────────────
    path("password/forgot/",    ForgotPasswordView.as_view(), name="password-forgot"),
    path("password/reset/",     ResetPasswordView.as_view(),  name="password-reset"),
    path("password/change/",    ChangePasswordView.as_view(), name="password-change"),
]