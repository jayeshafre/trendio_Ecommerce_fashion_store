"""
Auth service — all business logic lives here, NOT in views.

Views call service functions → service talks to DB + external services.
This makes testing, swapping implementations, and debugging easy.
"""
import logging
import random
import string
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import OTPCode, UserSession

logger = logging.getLogger(__name__)
User   = get_user_model()

# ── Constants ──────────────────────────────────────────────────────────────────
OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS   = 5


# ── Token helpers ──────────────────────────────────────────────────────────────
def generate_tokens_for_user(user, request=None):
    """
    Generate JWT access + refresh tokens for a user.
    Also records a session row for device tracking.
    Returns: { access, refresh, user }
    """
    refresh = RefreshToken.for_user(user)

    # Add custom claims
    refresh["role"]       = user.role
    refresh["email"]      = user.email
    refresh["full_name"]  = user.get_full_name()

    # Record session
    device_info = _get_device_info(request)
    ip_address  = _get_client_ip(request)
    UserSession.objects.create(
        user          = user,
        refresh_token = str(refresh),
        device_info   = device_info,
        ip_address    = ip_address,
        expires_at    = timezone.now() + timedelta(days=7),
    )

    return {
        "access":  str(refresh.access_token),
        "refresh": str(refresh),
        "user":    user,
    }


def invalidate_refresh_token(refresh_token_str):
    """
    Blacklists a refresh token and removes its session record.
    Called on logout.
    """
    try:
        token = RefreshToken(refresh_token_str)
        token.blacklist()
    except Exception as e:
        logger.warning(f"Token blacklist failed: {e}")

    # Also remove from our sessions table
    UserSession.objects.filter(refresh_token=refresh_token_str).delete()


def invalidate_all_sessions(user):
    """Logout from all devices — deletes all session records."""
    sessions = UserSession.objects.filter(user=user)
    for session in sessions:
        try:
            token = RefreshToken(session.refresh_token)
            token.blacklist()
        except Exception:
            pass
    sessions.delete()


# ── OTP helpers ────────────────────────────────────────────────────────────────
def generate_otp(identifier, purpose):
    """
    Generates a 6-digit OTP, saves to DB, returns the code.
    Invalidates any existing unused OTPs for the same identifier+purpose.
    """
    # Invalidate old OTPs
    OTPCode.objects.filter(
        identifier=identifier,
        purpose=purpose,
        is_used=False,
    ).update(is_used=True)

    code = "".join(random.choices(string.digits, k=6))

    OTPCode.objects.create(
        identifier=identifier,
        code=code,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )

    logger.info(f"OTP generated for {identifier} | purpose={purpose}")
    return code


def verify_otp(identifier, code, purpose):
    """
    Verifies an OTP code.
    Returns (True, None) on success, (False, error_message) on failure.
    """
    try:
        otp = OTPCode.objects.get(
            identifier=identifier,
            purpose=purpose,
            is_used=False,
        )
    except OTPCode.DoesNotExist:
        return False, "Invalid or expired code. Please request a new one."

    if otp.is_expired:
        return False, "This code has expired. Please request a new one."

    if otp.attempts >= MAX_OTP_ATTEMPTS:
        return False, "Too many incorrect attempts. Please request a new code."

    if otp.code != code:
        otp.attempts += 1
        otp.save(update_fields=["attempts"])
        remaining = MAX_OTP_ATTEMPTS - otp.attempts
        return False, f"Incorrect code. {remaining} attempt(s) remaining."

    # Success — mark as used
    otp.is_used = True
    otp.save(update_fields=["is_used"])
    return True, None


def send_otp_sms(phone, code):
    """
    Sends OTP via SMS (Twilio).
    In dev: just logs the code.
    """
    from django.conf import settings
    if settings.DEBUG:
        logger.info(f"[DEV] OTP for {phone}: {code}")
        return True

    # TODO: integrate Twilio
    # client = twilio_client()
    # client.messages.create(
    #     body=f"Your Trendio OTP is: {code}. Valid for {OTP_EXPIRY_MINUTES} minutes.",
    #     from_=settings.TWILIO_PHONE_NUMBER,
    #     to=f"+91{phone}",
    # )
    return True


def send_otp_email(email, code, purpose):
    """
    Sends OTP via email (SendGrid).
    In dev: just logs the code.
    """
    from django.conf import settings
    if settings.DEBUG:
        logger.info(f"[DEV] OTP email for {email} ({purpose}): {code}")
        return True

    # TODO: integrate SendGrid
    # send_mail(
    #     subject="Your Trendio security code",
    #     message=f"Your code is: {code}",
    #     from_email=settings.DEFAULT_FROM_EMAIL,
    #     recipient_list=[email],
    # )
    return True


# ── Private helpers ────────────────────────────────────────────────────────────
def _get_device_info(request):
    if not request:
        return ""
    ua = request.META.get("HTTP_USER_AGENT", "")
    return ua[:255]


def _get_client_ip(request):
    if not request:
        return None
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")