"""
Custom User model for Trendio.

Design decisions:
- Email is the primary login identifier (not username)
- Phone is optional but must be unique if provided
- Roles: CUSTOMER (default) | ADMIN
- is_verified tracks email/phone verification status
- UUID primary key for security (no sequential IDs exposed in URLs)
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        ADMIN    = "admin",    "Admin"

    # ── Identity ───────────────────────────────────────────────
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email      = models.EmailField(unique=True, db_index=True)
    phone      = models.CharField(max_length=15, unique=True, null=True, blank=True, db_index=True)
    first_name = models.CharField(max_length=150)
    last_name  = models.CharField(max_length=150)

    # ── Role & Status ──────────────────────────────────────────
    role        = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_verified = models.BooleanField(default=False)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)

    # ── Timestamps ─────────────────────────────────────────────
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at  = models.DateTimeField(auto_now=True)

    # ── Auth config ────────────────────────────────────────────
    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        db_table    = "users"
        verbose_name        = "User"
        verbose_name_plural = "Users"
        ordering    = ["-date_joined"]
        indexes     = [
            models.Index(fields=["email"]),
            models.Index(fields=["phone"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN


class OTPCode(models.Model):
    """
    One-time passcode for phone/email verification and OTP login.
    Soft-deletes via is_used to prevent replay attacks.
    """

    class Purpose(models.TextChoices):
        PHONE_VERIFY   = "phone_verify",   "Phone Verification"
        EMAIL_VERIFY   = "email_verify",   "Email Verification"
        OTP_LOGIN      = "otp_login",      "OTP Login"
        PASSWORD_RESET = "password_reset", "Password Reset"

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identifier = models.CharField(max_length=255, db_index=True)   # email or phone
    code       = models.CharField(max_length=6)
    purpose    = models.CharField(max_length=30, choices=Purpose.choices)
    attempts   = models.PositiveSmallIntegerField(default=0)
    is_used    = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "otp_codes"
        indexes  = [
            models.Index(fields=["identifier", "purpose", "is_used"]),
        ]

    def __str__(self):
        return f"OTP({self.identifier} | {self.purpose})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired and self.attempts < 5


class UserSession(models.Model):
    """
    Tracks active refresh token sessions per device.
    Enables: logout from all devices, device management UI (future).
    """
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    refresh_token = models.TextField(unique=True)
    device_info   = models.CharField(max_length=255, blank=True)
    ip_address    = models.GenericIPAddressField(null=True, blank=True)
    expires_at    = models.DateTimeField()
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_sessions"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["user", "expires_at"]),
        ]

    def __str__(self):
        return f"Session({self.user.email} | {self.device_info or 'Unknown'})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at