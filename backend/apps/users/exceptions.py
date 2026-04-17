"""
Custom DRF exception handler.

Ensures ALL errors from the API follow a consistent shape:
{
  "detail": "...",          ← human-readable message
  "code": "...",            ← machine-readable code
  "errors": { ... }         ← field-level validation errors (optional)
}

This makes frontend error handling trivial.
"""
import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    # Call DRF's default handler first
    response = exception_handler(exc, context)

    if response is not None:
        data = response.data

        # Normalize the response shape
        normalized = {}

        if isinstance(data, dict):
            # Field-level validation errors → move to "errors"
            field_errors = {
                k: v for k, v in data.items()
                if k not in ("detail", "code")
            }
            if field_errors:
                normalized["errors"] = {
                    k: v[0] if isinstance(v, list) else v
                    for k, v in field_errors.items()
                }

            normalized["detail"] = (
                data.get("detail")
                or next(iter(field_errors.values()), ["An error occurred."])[0]
                or "An error occurred."
            )
        elif isinstance(data, list):
            normalized["detail"] = data[0] if data else "An error occurred."
        else:
            normalized["detail"] = str(data)

        normalized["status_code"] = response.status_code

        # Log server errors
        if response.status_code >= 500:
            logger.error(f"Server error: {normalized}", exc_info=exc)

        response.data = normalized

    return response