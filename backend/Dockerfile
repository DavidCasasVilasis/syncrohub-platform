FROM python:3.10-slim

WORKDIR /app

# Instalar uv para dependencias ultra rápidas y reproducibles
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copiar archivos de dependencias
COPY pyproject.toml uv.lock ./

# Instalar dependencias del proyecto
RUN uv sync --frozen --no-dev

# Copiar código fuente
COPY app/ ./app/
COPY simulator/ ./simulator/

# Exponer puerto FastAPI
EXPOSE 8000

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
