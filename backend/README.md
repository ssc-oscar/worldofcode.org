# World of Code Backend

Next generation backend of worldofcode.org.

## Prerequisites

- Python 3.8+
- MongoDB
- ClickHouse

## Local Setup

1. Copy `.secrets.toml` and fill in your credentials
2. We use `uv` to manage the dependencies. Install it with:
 ```bash
curl -LsSf https://astral.sh/uv/install.sh | sudo env UV_INSTALL_DIR=/usr/local/bin sh
 ```
3. Run `uv sync` to install the dependencies.
4. Run the development server with `uv run -m woc_backend`.
