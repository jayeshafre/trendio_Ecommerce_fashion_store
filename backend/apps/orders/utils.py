"""
Order number generator.

Format: TRD-YYYYMMDD-XXXX
  TRD      → Trendio prefix
  YYYYMMDD → date placed
  XXXX     → zero-padded daily sequence (resets each day)

Examples:
  TRD-20240812-0001
  TRD-20240812-0042
  TRD-20240813-0001  ← new day, sequence resets

Concurrency safety:
  Uses DB-level filtering with a transaction + the unique constraint
  on order_number to prevent duplicates under concurrent requests.
  If two requests try the same number simultaneously, one will
  get an IntegrityError and retry (handled in services.py).
"""
from django.utils import timezone


def generate_order_number() -> str:
    """
    Generate a unique human-readable order number.
    Called inside the atomic transaction in OrderService.place_order().
    """
    from .models import Order  # local import to avoid circular imports

    today       = timezone.now().date()
    date_str    = today.strftime("%Y%m%d")
    prefix      = f"TRD-{date_str}-"

    # Count today's orders to determine next sequence number
    today_count = Order.objects.filter(
        order_number__startswith=prefix
    ).count()

    sequence    = today_count + 1
    return f"{prefix}{sequence:04d}"  # TRD-20240812-0042