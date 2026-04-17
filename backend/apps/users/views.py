"""
Auth Views — thin controllers. All logic delegates to services.py.

Endpoints covered:
    POST   /api/v1/auth/register/
    POST   /api/v1/auth/login/
    POST   /api/v1/auth/logout/
    GET    /api/v1/auth/me/
    PATCH  /api/v1/auth/me/
    POST   /api/v1/auth/otp/send/
    POST   /api/v1/auth/otp/verify/
    POST   /api/v1/auth/password/forgot/
    POST   /api/v1/auth/password/reset/
    POST   /api/v1/auth/password/change/
    POST   /api/v1/auth/token/refresh/
"""
import logging

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import OTPCode
from .serializers import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    OTPSendSerializer,
    OTPVerifySerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserMeSerializer,
)
from . import services

logger = logging.getLogger(__name__)
User   = get_user_model()


# ── Register ───────────────────────────────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    """
    Register a new customer account.
    Account is created in unverified state — OTP verification required.
    """
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(tags=["Auth"])
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Auto-send email OTP for verification
        code = services.generate_otp(user.email, "email_verify")
        services.send_otp_email(user.email, code, "email_verify")

        logger.info(f"New user registered: {user.email}")

        return Response(
            {
                "message": "Account created. Please verify your email to activate it.",
                "user_id": str(user.id),
                "email":   user.email,
            },
            status=status.HTTP_201_CREATED,
        )


# ── Login ──────────────────────────────────────────────────────────────────────
class LoginView(APIView):
    """
    Authenticate with email + password.
    Returns JWT access + refresh tokens.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(tags=["Auth"], request=LoginSerializer)
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user   = serializer.validated_data["user"]
        tokens = services.generate_tokens_for_user(user, request)

        logger.info(f"User logged in: {user.email}")

        return Response(
            {
                "access":  tokens["access"],
                "refresh": tokens["refresh"],
                "user":    UserMeSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


# ── Logout ────────────────────────────────────────────────────────────────────
class LogoutView(APIView):
    """
    Invalidates the refresh token and removes the session.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Auth"], request=LogoutSerializer)
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.invalidate_refresh_token(serializer.validated_data["refresh"])
        logger.info(f"User logged out: {request.user.email}")

        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


# ── Me (profile) ──────────────────────────────────────────────────────────────
class MeView(generics.RetrieveUpdateAPIView):
    """
    GET  — Returns the current authenticated user's profile.
    PATCH — Partially updates name/phone.
    """
    serializer_class   = UserMeSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ["get", "patch"]

    @extend_schema(tags=["Auth"])
    def get_object(self):
        return self.request.user


# ── OTP Send ──────────────────────────────────────────────────────────────────
class OTPSendView(APIView):
    """
    Generates and sends a 6-digit OTP to phone or email.
    Purpose determines the flow: phone_verify | otp_login | password_reset
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(tags=["Auth | OTP"], request=OTPSendSerializer)
    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"]
        purpose    = serializer.validated_data["purpose"]

        # For OTP login — ensure user exists
        if purpose == "otp_login":
            exists = (
                User.objects.filter(email=identifier).exists()
                or User.objects.filter(phone=identifier).exists()
            )
            if not exists:
                # Security: don't reveal if user exists; still return 200
                logger.warning(f"OTP login attempted for non-existent: {identifier}")
                return Response(
                    {"message": "If an account exists, a code has been sent."},
                    status=status.HTTP_200_OK,
                )

        code = services.generate_otp(identifier, purpose)

        # Determine send channel
        is_email = "@" in identifier
        if is_email:
            services.send_otp_email(identifier, code, purpose)
        else:
            services.send_otp_sms(identifier, code)

        return Response(
            {"message": "OTP sent successfully.", "expires_in_minutes": 10},
            status=status.HTTP_200_OK,
        )


# ── OTP Verify ────────────────────────────────────────────────────────────────
class OTPVerifyView(APIView):
    """
    Verifies OTP and performs the action based on purpose:
    - phone_verify  → marks user phone as verified
    - email_verify  → marks user as verified
    - otp_login     → returns JWT tokens (passwordless login)
    - password_reset → validated; client proceeds to /password/reset/
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(tags=["Auth | OTP"], request=OTPVerifySerializer)
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"]
        code       = serializer.validated_data["code"]
        purpose    = serializer.validated_data["purpose"]

        valid, error = services.verify_otp(identifier, code, purpose)
        if not valid:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        # ── Post-verification actions ───────────────────────
        if purpose == "email_verify":
            User.objects.filter(email=identifier).update(is_verified=True)
            return Response({"message": "Email verified successfully."})

        if purpose == "phone_verify":
            User.objects.filter(phone=identifier).update(is_verified=True)
            return Response({"message": "Phone number verified successfully."})

        if purpose == "otp_login":
            try:
                user = User.objects.get(phone=identifier) if "@" not in identifier \
                    else User.objects.get(email=identifier)
            except User.DoesNotExist:
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            tokens = services.generate_tokens_for_user(user, request)
            logger.info(f"OTP login successful: {identifier}")
            return Response(
                {
                    "access":  tokens["access"],
                    "refresh": tokens["refresh"],
                    "user":    UserMeSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )

        # password_reset — just confirm OTP is valid; client moves to reset step
        return Response({"message": "OTP verified. Proceed to set new password."})


# ── Forgot Password ───────────────────────────────────────────────────────────
class ForgotPasswordView(APIView):
    """
    Sends a 6-digit password reset OTP to the registered email.
    Always returns 200 to prevent user enumeration.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(tags=["Auth | Password"], request=ForgotPasswordSerializer)
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        if User.objects.filter(email=email).exists():
            code = services.generate_otp(email, "password_reset")
            services.send_otp_email(email, code, "password_reset")
            logger.info(f"Password reset OTP sent to: {email}")

        return Response(
            {"message": "If this email is registered, a recovery code has been sent."},
            status=status.HTTP_200_OK,
        )


# ── Reset Password ────────────────────────────────────────────────────────────
class ResetPasswordView(APIView):
    """
    Verifies OTP + sets new password in one step.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(tags=["Auth | Password"], request=ResetPasswordSerializer)
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email    = serializer.validated_data["email"]
        otp_code = serializer.validated_data["otp"]
        password = serializer.validated_data["password"]

        valid, error = services.verify_otp(email, otp_code, "password_reset")
        if not valid:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(password)
        user.save(update_fields=["password"])

        # Invalidate all sessions (force re-login on all devices)
        services.invalidate_all_sessions(user)

        logger.info(f"Password reset completed for: {email}")
        return Response({"message": "Password reset successful. Please sign in."})


# ── Change Password (authenticated) ───────────────────────────────────────────
class ChangePasswordView(APIView):
    """
    Changes password for an authenticated user.
    Requires current password verification.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Auth | Password"], request=ChangePasswordSerializer)
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])

        # Invalidate all sessions (security best practice)
        services.invalidate_all_sessions(request.user)

        logger.info(f"Password changed for: {request.user.email}")
        return Response({"message": "Password changed. Please sign in again."})