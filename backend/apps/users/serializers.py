"""
Auth serializers — production-grade validation.
"""
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

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
    """
    Accepts EITHER email or phone number in the `identifier` field.
    Also accepts `email` directly for backwards compatibility with frontend.

    Flow:
      1. Client sends { identifier: "9876543210", password: "..." }
         OR { identifier: "user@email.com", password: "..." }
         OR { email: "user@email.com", password: "..." }   ← legacy
      2. We detect whether it's a phone or email
      3. Look up the user by that field
      4. Call authenticate() with their email (Django's USERNAME_FIELD)
    """
    # Accept either field name — frontend can send "identifier" or "email"
    identifier = serializers.CharField(required=False, allow_blank=True)
    email      = serializers.EmailField(required=False, allow_blank=True)
    password   = serializers.CharField(write_only=True)

    def validate(self, attrs):
        # ── Step 1: resolve identifier ────────────────────────────────────────
        # Accept either "identifier" or legacy "email" field
        raw = (attrs.get("identifier") or attrs.get("email") or "").strip()

        if not raw:
            raise serializers.ValidationError(
                {"identifier": "Please enter your email or mobile number."}
            )

        password = attrs.get("password", "")

        # ── Step 2: detect phone vs email ─────────────────────────────────────
        is_phone = raw.isdigit() or (raw.startswith("+") and raw[1:].isdigit())

        if is_phone:
            # Strip leading country code if user types +91XXXXXXXXXX
            phone = raw.lstrip("+")
            if phone.startswith("91") and len(phone) == 12:
                phone = phone[2:]   # strip 91, keep 10-digit number

            # Look up user by phone
            try:
                user_obj = User.objects.get(phone=phone)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"identifier": "No account found with this mobile number."}
                )
            # Authenticate using their email (Django USERNAME_FIELD = email)
            login_email = user_obj.email
        else:
            login_email = raw.lower()

        # ── Step 3: authenticate ──────────────────────────────────────────────
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