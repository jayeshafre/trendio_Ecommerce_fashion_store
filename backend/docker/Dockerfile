# ─── Stage 1: Builder ──────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install --no-cache-dir poetry==1.8.3

# Copy dependency files only (cache layer)
COPY pyproject.toml poetry.lock ./

# Export to requirements.txt and install
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --without dev
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
USER trendio

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
