"""
Auth serializers — production-grade validation.
"""
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import UserAddress

User = get_user_model()


# ── Register ──────────────────────────────────────────────────────────────────
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
        return User.objects.create_user(**validated_data)


# ── Login ─────────────────────────────────────────────────────────────────────
class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=False, allow_blank=True)
    email      = serializers.EmailField(required=False, allow_blank=True)
    password   = serializers.CharField(write_only=True)

    def validate(self, attrs):
        raw = (attrs.get("identifier") or attrs.get("email") or "").strip()

        if not raw:
            raise serializers.ValidationError(
                {"identifier": "Please enter your email or mobile number."}
            )

        password = attrs.get("password", "")
        is_phone = raw.isdigit() or (raw.startswith("+") and raw[1:].isdigit())

        if is_phone:
            phone = raw.lstrip("+")
            if phone.startswith("91") and len(phone) == 12:
                phone = phone[2:]
            try:
                user_obj = User.objects.get(phone=phone)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"identifier": "No account found with this mobile number."}
                )
            login_email = user_obj.email
        else:
            login_email = raw.lower()

        user = authenticate(
            request=self.context.get("request"),
            username=login_email,
            password=password,
        )

        if not user:
            raise serializers.ValidationError(
                {"detail": "Invalid credentials. Please try again."}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Your account has been deactivated. Contact support."}
            )

        attrs["user"] = user
        return attrs


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


# ── Update Profile ────────────────────────────────────────────────────────────
class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["first_name", "last_name", "phone"]

    def validate_first_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("First name cannot be blank.")
        return value

    def validate_last_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Last name cannot be blank.")
        return value

    def validate_phone(self, value):
        if not value:
            return value
        clean = value.strip().replace(" ", "")
        if not clean.isdigit() or len(clean) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        qs = User.objects.filter(phone=clean).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This mobile number is already registered.")
        return clean


# ── Address (read) ────────────────────────────────────────────────────────────
class UserAddressSerializer(serializers.ModelSerializer):
    formatted = serializers.CharField(read_only=True)

    class Meta:
        model  = UserAddress
        fields = [
            "id", "full_name", "phone",
            "address_line1", "address_line2",
            "city", "state", "pincode",
            "is_default", "formatted",
        ]


# ── Address (write) ───────────────────────────────────────────────────────────
class UserAddressWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserAddress
        fields = [
            "full_name", "phone",
            "address_line1", "address_line2",
            "city", "state", "pincode",
            "is_default",
        ]

    def validate_phone(self, value):
        clean = value.strip().replace(" ", "")
        if not clean.isdigit() or len(clean) not in (10, 12):
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        return clean

    def validate_pincode(self, value):
        if not value.strip().isdigit() or len(value.strip()) != 6:
            raise serializers.ValidationError("Enter a valid 6-digit pincode.")
        return value.strip()


# ── Token response ────────────────────────────────────────────────────────────
class TokenResponseSerializer(serializers.Serializer):
    access  = serializers.CharField()
    refresh = serializers.CharField()
    user    = serializers.SerializerMethodField()

    def get_user(self, obj):
        return UserMeSerializer(obj["user"]).data


# ── OTP Send ──────────────────────────────────────────────────────────────────
class OTPSendSerializer(serializers.Serializer):
    identifier = serializers.CharField(help_text="Phone number or email address")
    purpose    = serializers.ChoiceField(
        choices=["phone_verify", "email_verify", "otp_login", "password_reset"]
    )

    def validate_identifier(self, value):
        return value.strip()


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


# ── Change Password (authenticated) ──────────────────────────────────────────
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