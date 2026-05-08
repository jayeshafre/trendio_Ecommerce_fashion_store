"""
Auth + Address Views — all under /api/v1/auth/

Address endpoints added here (users module owns addresses):
    GET    /api/v1/auth/addresses/        → list user's addresses
    POST   /api/v1/auth/addresses/        → create address
    GET    /api/v1/auth/addresses/{id}/   → single address
    PATCH  /api/v1/auth/addresses/{id}/   → update address
    DELETE /api/v1/auth/addresses/{id}/   → delete address
"""
import logging

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum
from rest_framework.pagination import PageNumberPagination

from apps.users.throttles import RegisterRateThrottle
from apps.users.throttles import LoginRateThrottle
from apps.users.throttles import OTPSendRateThrottle
from apps.users.throttles import OTPVerifyRateThrottle
from apps.users.throttles import PasswordForgotRateThrottle
from apps.users.throttles import PasswordResetRateThrottle
from apps.users.throttles import PasswordChangeRateThrottle

from .models import UserAddress
from .serializers import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    GoogleAuthSerializer,
    LoginSerializer,
    LogoutSerializer,
    OTPSendSerializer,
    OTPVerifySerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UpdateProfileSerializer,
    UserAddressSerializer,
    UserAddressWriteSerializer,
    UserMeSerializer,
)

from apps.users.throttles import (
    LoginRateThrottle,
    RegisterRateThrottle,
    OTPSendRateThrottle,
    OTPVerifyRateThrottle,
    PasswordForgotRateThrottle,
    PasswordResetRateThrottle,
    PasswordChangeRateThrottle,
)
from . import services

logger = logging.getLogger(__name__)
User   = get_user_model()


# ── Register ───────────────────────────────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes   = [RegisterRateThrottle] 

    @extend_schema(tags=["Auth"])
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

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
    permission_classes = [permissions.AllowAny]
    throttle_classes   = [LoginRateThrottle]

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


class GoogleAuthView(APIView):
    """
    POST /api/v1/auth/google/
    Body: { "id_token": "<google_id_token>" }
    Returns: { access, refresh, user }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        id_token_str = serializer.validated_data["id_token"]

        try:
            payload = services.verify_google_token(id_token_str)
            user    = services.get_or_create_google_user(payload)
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        token_data = services.generate_tokens_for_user(user, request)
        is_new_user  = not bool(user.phone)   # new if no phone on record

        logger.info(f"Google OAuth login: {user.email} | new={is_new_user}")
        return Response(
            {
                "access":  token_data["access"],
                "refresh": token_data["refresh"],
                "user":    UserMeSerializer(user).data,
                "is_new_user":  is_new_user,
            },
            status=status.HTTP_200_OK
        )
    
# ── Logout ────────────────────────────────────────────────────────────────────
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Auth"], request=LogoutSerializer)
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.invalidate_refresh_token(serializer.validated_data["refresh"])
        logger.info(f"User logged out: {request.user.email}")

        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


# ── Me (profile) ──────────────────────────────────────────────────────────────
class MeView(APIView):
    """
    GET   → current user profile
    PATCH → update first_name, last_name, phone only
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Auth"])
    def get(self, request):
        return Response(UserMeSerializer(request.user).data)

    @extend_schema(tags=["Auth"], request=UpdateProfileSerializer)
    def patch(self, request):
        serializer = UpdateProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserMeSerializer(request.user).data)


# ── Addresses ─────────────────────────────────────────────────────────────────
class AddressListCreateView(generics.ListCreateAPIView):
    """
    GET  → list all saved addresses for the current user (plain array, no pagination)
    POST → add a new delivery address
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserAddressWriteSerializer
        return UserAddressSerializer

    # Override list to return plain array (not paginated) — frontend expects []
    @extend_schema(tags=["Auth | Addresses"])
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = UserAddressSerializer(queryset, many=True)
        return Response(serializer.data)   # ← plain array, not {count, results}

    @extend_schema(tags=["Auth | Addresses"])
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    → single address
    PATCH  → update address fields
    DELETE → delete address
    """
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ["get", "patch", "delete"]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return UserAddressWriteSerializer
        return UserAddressSerializer

    @extend_schema(tags=["Auth | Addresses"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ── OTP Send ──────────────────────────────────────────────────────────────────
class OTPSendView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes   = [OTPSendRateThrottle]

    @extend_schema(tags=["Auth | OTP"], request=OTPSendSerializer)
    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"]
        purpose    = serializer.validated_data["purpose"]

        if purpose == "otp_login":
            exists = (
                User.objects.filter(email=identifier).exists()
                or User.objects.filter(phone=identifier).exists()
            )
            if not exists:
                logger.warning(f"OTP login attempted for non-existent: {identifier}")
                return Response(
                    {"message": "If an account exists, a code has been sent."},
                    status=status.HTTP_200_OK,
                )

        code     = services.generate_otp(identifier, purpose)
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
    permission_classes = [permissions.AllowAny]
    throttle_classes   = [OTPVerifyRateThrottle] 

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

        return Response({"message": "OTP verified. Proceed to set new password."})


# ── Forgot Password ───────────────────────────────────────────────────────────
class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes   = [PasswordForgotRateThrottle]

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
    permission_classes = [permissions.AllowAny]
    throttle_classes   = [PasswordResetRateThrottle]

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
        services.invalidate_all_sessions(user)

        logger.info(f"Password reset completed for: {email}")
        return Response({"message": "Password reset successful. Please sign in."})


# ── Change Password (authenticated) ───────────────────────────────────────────
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes   = [PasswordChangeRateThrottle]

    @extend_schema(tags=["Auth | Password"], request=ChangePasswordSerializer)
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        services.invalidate_all_sessions(request.user)

        logger.info(f"Password changed for: {request.user.email}")
        return Response({"message": "Password changed. Please sign in again."})
    
# ── Admin permission (reuse pattern from orders) ──────────────
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"
 
 
class UserAdminPagination(PageNumberPagination):
    page_size             = 15
    page_size_query_param = "page_size"
    max_page_size         = 100
 
 
# ── Admin: User List ──────────────────────────────────────────
class AdminUserListView(APIView):
    """
    GET /auth/admin/users/
 
    Query params:
      ?search=       → filter by email, first_name, last_name
      ?is_active=    → true / false
      ?role=         → customer / admin
      ?page=         → pagination
    """
    permission_classes = [IsAdminUser]
 
    def get(self, request):
        qs = User.objects.all().order_by("-date_joined")
 
        # Filters
        search    = request.query_params.get("search", "").strip()
        is_active = request.query_params.get("is_active")
        role      = request.query_params.get("role")
 
        if search:
            qs = qs.filter(
                Q(email__icontains=search)      |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(phone__icontains=search)
            )
 
        if is_active is not None:
            qs = qs.filter(is_active=(is_active.lower() == "true"))
 
        if role:
            qs = qs.filter(role=role)
 
        # Pagination
        paginator = UserAdminPagination()
        page      = paginator.paginate_queryset(qs, request)
 
        data = [
            {
                "id":          str(u.id),
                "email":       u.email,
                "full_name":   u.get_full_name() or "—",
                "phone":       u.phone or "—",
                "role":        u.role,
                "is_active":   u.is_active,
                "is_verified": u.is_verified,
                "date_joined": u.date_joined.isoformat(),
            }
            for u in page
        ]
 
        return paginator.get_paginated_response(data)
 
 
# ── Admin: User Detail ────────────────────────────────────────
class AdminUserDetailView(APIView):
    """
    GET /auth/admin/users/{id}/
    Returns full user profile + order summary for admin view.
    """
    permission_classes = [IsAdminUser]
 
    def get(self, request, pk):
        from apps.orders.models import Order
 
        user = get_object_or_404(User, id=pk)
 
        order_summary = user.orders.aggregate(
            total_orders  = Count("id"),
            total_spent   = Sum("total_amount"),
        )
 
        return Response({
            "id":           str(user.id),
            "email":        user.email,
            "first_name":   user.first_name,
            "last_name":    user.last_name,
            "phone":        user.phone or "—",
            "role":         user.role,
            "is_active":    user.is_active,
            "is_verified":  user.is_verified,
            "date_joined":  user.date_joined.isoformat(),
            "last_login":   user.last_login.isoformat() if user.last_login else None,
            "order_summary": {
                "total_orders": order_summary["total_orders"] or 0,
                "total_spent":  float(order_summary["total_spent"] or 0),
            },
        })
 
 
# ── Admin: Toggle User Active (Soft Delete) ───────────────────
class AdminUserToggleView(APIView):
    """
    PATCH /auth/admin/users/{id}/toggle/
 
    Soft delete pattern — toggles is_active.
    Deactivated users cannot log in (handled by Django auth).
    Cannot deactivate another admin or yourself.
    """
    permission_classes = [IsAdminUser]
 
    def patch(self, request, pk):
        user = get_object_or_404(User, id=pk)
 
        # Safety guards
        if str(user.id) == str(request.user.id):
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        if user.role == "admin":
            return Response(
                {"detail": "Admin accounts cannot be deactivated via this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )
 
        # Toggle
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
 
        action = "activated" if user.is_active else "deactivated"
        logger.info(
            f"Admin {request.user.email} {action} user {user.email}"
        )
 
        return Response({
            "message":   f"User {user.email} has been {action}.",
            "is_active": user.is_active,
        })