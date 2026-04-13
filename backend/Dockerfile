# Backend Dockerfile with multi-stage build

# ---- Base ----
FROM python:3.12-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ---- Development ----
FROM base AS development

# Install the materia core engine
COPY pyproject.toml README.md ./
COPY src/ ./src/
RUN pip install --no-cache-dir -e .

# Install backend dependencies
COPY backend/pyproject.toml ./backend/
RUN cd backend && pip install --no-cache-dir -e ".[dev]"

COPY backend/ ./backend/

WORKDIR /app/backend
EXPOSE 8000

# ---- Production ----
FROM base AS production

RUN useradd --create-home --uid 10001 appuser

# Install the materia core engine
COPY pyproject.toml README.md ./
COPY src/ ./src/
RUN pip install --no-cache-dir .

# Install backend dependencies
COPY backend/pyproject.toml ./backend/
RUN cd backend && pip install --no-cache-dir .

# Install heavy optional deps for electronic structure endpoints
# mp-api + pymatgen enable band structure, DOS, XRD, phase diagrams
RUN pip install --no-cache-dir "mp-api>=0.41" "pymatgen>=2024.2.8" || \
    echo "WARNING: mp-api/pymatgen install failed — electronic structure endpoints degraded"

COPY backend/ ./backend/
WORKDIR /app/backend

USER appuser
EXPOSE 8000

CMD ["gunicorn", "app.main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "3", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--preload"]
