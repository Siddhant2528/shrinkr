FROM python:3.11-slim

# Prevents Python from writing .pyc files and buffers stdout/stderr
# so logs appear immediately in docker logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install curl for Docker HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python -c "import geoip2; print('geoip2 ok')"

RUN chmod +x startup.sh

# Run as a non-root user for security
RUN adduser --disabled-password --no-create-home --gecos "" shrinkruser
USER shrinkruser

# Health check — polls /health every 30s, 3 retries, 30s grace period for startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["./startup.sh"]