"""
apps/users/throttles.py — Per-endpoint throttle classes for auth routes.

Uses Redis cache (already configured in base.py) as the throttle backend.
Each class maps to a rate defined in DEFAULT_THROTTLE_RATES in settings.

Rates are intentionally strict — these endpoints are the primary attack surface.
Dev environment disables all throttling via dev.py, so these only apply in prod.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


# ── Anonymous (IP-based) throttles ───────────────────────────

class LoginRateThrottle(AnonRateThrottle):
    """
    5 login attempts per minute per IP.
    Stops brute-force password attacks.
    """
    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    """
    10 registrations per hour per IP.
    Stops mass account creation / spam signups.
    """
    scope = "register"


class OTPSendRateThrottle(AnonRateThrottle):
    """
    3 OTP sends per minute per IP.
    Prevents SMS/email flooding and associated costs.
    """
    scope = "otp_send"


class OTPVerifyRateThrottle(AnonRateThrottle):
    """
    10 OTP verify attempts per minute per IP.
    Stops automated OTP brute-forcing (6-digit = 1M combinations).
    """
    scope = "otp_verify"


class PasswordForgotRateThrottle(AnonRateThrottle):
    """
    3 forgot-password requests per hour per IP.
    Stops email/SMS flooding via password reset.
    """
    scope = "password_forgot"


class PasswordResetRateThrottle(AnonRateThrottle):
    """
    5 password reset attempts per hour per IP.
    """
    scope = "password_reset"


# ── Authenticated (user-based) throttles ─────────────────────

class PasswordChangeRateThrottle(UserRateThrottle):
    """
    5 password changes per hour per user.
    Stops automated credential cycling.
    """
    scope = "password_change"


class TokenRefreshRateThrottle(UserRateThrottle):
    """
    30 token refreshes per minute per user.
    Generous for normal use, blocks automated token farming.
    """
    scope = "token_refresh"