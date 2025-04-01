# World of Code Backend

Next generation backend of worldofcode.org.

## Features

- HTTP API (finally) + Python client (WocMapsRemote in python-woc).
- Password-less user system with GitHub, Microsoft SSO integration. Email users login by navigating through a magic link in automaticlly sent email.
- IP/User based rate limit. Visitors are rate limited by IP address, and users can log in to enjoy a higher limit.
- OpenAI-style API key management. Users can create an API key on the website and pass that as a parameter to the python client.
- Real random sampling with arbitary queries.
- And more to discover!

## Deployment

This project is deployed on a single server, using Docker Compose.

Before all, clone the repositories with submodules:

```bash
git clone --recurse-submodules https://github.com/ssc-oscar/woc-backend.git
```

First, edit the following files:

- `docker-compose.yml`: Edit bind volumes paths.
- `settings.toml`: The configuration file.
- `.secrets.toml`: Secrets. This file is not checked into the repository, so please copy from `settings.toml` and fill in your credentials.

Then, run the following command to start the services:

```bash
docker compose build
docker compose up -d
```

Tip: if you are on Ubuntu or Debian, install `docker-compose-v2` instead of `docker-compose`.

## Development

### Prerequisites

- Python 3.8+
- MongoDB
- ClickHouse

### Local Setup

1. Copy `.secrets.toml` and fill in your credentials
2. We use `uv` to manage the dependencies. Install it with `pip install uv` if you haven't done so.
3. Run `uv sync` to install the dependencies.
4. Run the development server with `uv run -m woc_backend`.
