FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install --no-cache-dir uv

# Install dependencies using uv
COPY pyproject.toml uv.lock ./
RUN uv pip install --system .

# Copy project files
COPY woc_backend/ ./woc_backend/

# Expose the port the app runs on
EXPOSE 8234

# Command to run the application
CMD ["uvicorn", "woc_backend", "--host", "0.0.0.0", "--port", "8234"]
