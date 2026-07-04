# ─── Stage 1: Builder ──────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install poetry (2.x required — pyproject.toml declares poetry-core>=2.0.0)
# plus the export plugin, which is no longer bundled with poetry core
RUN pip install --no-cache-dir "poetry>=2.0,<3.0" poetry-plugin-export

# Copy dependency files only (cache layer)
COPY pyproject.toml poetry.lock ./

# Whether to include dev-group deps (pytest, black, django-debug-toolbar, etc.)
# Local docker-compose testing runs config.settings.dev, which needs
# django-debug-toolbar — so compose passes INSTALL_DEV=true as a build arg.
# Render/production builds omit this arg, defaulting to false, keeping
# the image lean since config.settings.prod never imports these packages.
ARG INSTALL_DEV=false
RUN if [ "$INSTALL_DEV" = "true" ]; then \
    poetry export -f requirements.txt --output requirements.txt --without-hashes --with dev; \
    else \
    poetry export -f requirements.txt --output requirements.txt --without-hashes --without dev; \
    fi
RUN pip install --no-cache-dir -r requirements.txt

# ─── Stage 2: Runtime ──────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy source code
COPY . .

# Copy and set up entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Non-root user for security
RUN addgroup --system trendio && adduser --system --group trendio
RUN mkdir -p /app/staticfiles /app/media && chown -R trendio:trendio /app
USER trendio

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]