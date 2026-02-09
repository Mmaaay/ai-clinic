# Build stage for dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     build-essential \
     libgl1-mesa-glx \
     libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Production runtime
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/home/appuser/.local/bin:$PATH"

WORKDIR /app

# System deps for image/PDF handling
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     poppler-utils \
     libgl1-mesa-glx \
     libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 10001 appuser

# Copy installed packages from builder
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/')"

CMD ["python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
