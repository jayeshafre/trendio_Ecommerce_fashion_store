#!/bin/bash
set -e

# ─── Web service: run migrations, collect static, start Gunicorn ──────
if [ "$#" -eq 0 ]; then
  echo "── Running migrations..."
  python manage.py migrate --noinput

  echo "── Collecting static files..."
  python manage.py collectstatic --noinput

  echo "── Starting Gunicorn..."
  exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 4 \
    --worker-class gthread \
    --threads 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -
else
  # ─── Celery worker / beat / anything else: just run the given command ──
  echo "── Running: $@"
  exec "$@"
fi