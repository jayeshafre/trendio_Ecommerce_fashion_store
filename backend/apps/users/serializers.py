"""
Auth serializers — production-grade validation.

All user-facing errors are explicit and human-readable.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


# ── Register ───────────────────────────────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model  = User
        fields = ["first_name", "last_name", "email", "phone", "password", "password2"]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name":  {"required": True},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_phone(self, value):
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("This mobile number is already registered.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


# ── Login (Email + Password) ───────────────────────────────────────────────────
class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].lower(),
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password. Please try again."}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Your account has been deactivated. Contact support."}
            )
        attrs["user"] = user
        return attrs


# ── Token response ─────────────────────────────────────────────────────────────
class TokenResponseSerializer(serializers.Serializer):
    """Returned after successful login/OTP-verify."""
    access  = serializers.CharField()
    refresh = serializers.CharField()
    user    = serializers.SerializerMethodField()

    def get_user(self, obj):
        return UserMeSerializer(obj["user"]).data


# ── Me (current user) ─────────────────────────────────────────────────────────
class UserMeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            "id", "email", "phone", "first_name", "last_name",
            "full_name", "role", "is_verified", "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "is_verified", "date_joined"]

    def get_full_name(self, obj):
        return obj.get_full_name()


# ── OTP Send ──────────────────────────────────────────────────────────────────
class OTPSendSerializer(serializers.Serializer):
    identifier = serializers.CharField(help_text="Phone number or email address")
    purpose    = serializers.ChoiceField(
        choices=["phone_verify", "email_verify", "otp_login", "password_reset"]
    )

    def validate_identifier(self, value):
        return value.strip().lower()


# ── OTP Verify ────────────────────────────────────────────────────────────────
class OTPVerifySerializer(serializers.Serializer):
    identifier = serializers.CharField()
    code       = serializers.CharField(min_length=6, max_length=6)
    purpose    = serializers.ChoiceField(
        choices=["phone_verify", "email_verify", "otp_login", "password_reset"]
    )

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must be 6 digits.")
        return value


# ── Logout ────────────────────────────────────────────────────────────────────
class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


# ── Forgot Password ───────────────────────────────────────────────────────────
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Silently accept even if email doesn't exist (security: no user enumeration)
        return value.lower()


# ── Reset Password ────────────────────────────────────────────────────────────
class ResetPasswordSerializer(serializers.Serializer):
    email     = serializers.EmailField()
    otp       = serializers.CharField(min_length=6, max_length=6)
    password  = serializers.CharField(min_length=8, validators=[validate_password])
    password2 = serializers.CharField(min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs


# ── Change Password (authenticated) ───────────────────────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password     = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    new_password2    = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError(
                {"current_password": "Current password is incorrect."}
            )
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError(
                {"new_password2": "New passwords do not match."}
            )
        return attrs