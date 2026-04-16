"""
Production settings — deployed environment only.
"""

import environ
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

from .base import *  # noqa

env = environ.Env()

DEBUG = False

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

# ─── Security Headers ─────────────────────────────────────
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ─── AWS S3 for Media ─────────────────────────────────────
AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME")
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="ap-south-1")
AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
AWS_DEFAULT_ACL = None
AWS_S3_FILE_OVERWRITE = False

DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/"

# ─── Sentry Error Tracking ────────────────────────────────
sentry_sdk.init(
    dsn=env("SENTRY_DSN"),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=False,
)

# ─── Email via SendGrid ───────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.sendgrid.net"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "apikey"
EMAIL_HOST_PASSWORD = env("SENDGRID_API_KEY")
