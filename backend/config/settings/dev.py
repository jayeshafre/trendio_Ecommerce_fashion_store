"""
Development settings — local machine only.
"""

from .base import *  # noqa

DEBUG = True

# ─── Dev-only apps ─────────────────────────────────────────
INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405

MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa: F405

INTERNAL_IPS = ["127.0.0.1", "localhost"]

# ─── Email: Print to console in dev ───────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ─── Disable throttling in dev ────────────────────────────
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405

# ─── Allow all CORS origins in dev ────────────────────────
CORS_ALLOW_ALL_ORIGINS = True
