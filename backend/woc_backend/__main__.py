import argparse
import asyncio
import fcntl
import os
from contextlib import asynccontextmanager

import uvicorn
from beanie import Document, init_beanie
from clickhouse_driver import Client as Ch
from fastapi import Depends, FastAPI
from loguru import logger
from pymongo import AsyncMongoClient
from woc.local import WocMapsLocal

from .auth.models import OneTimeCode, Token, User
from .auth.routes import api as auth_api
from .clickhouse.routes import api as clickhouse_api
from .config import settings
from .lookup.routes import api as lookup_api
from .mongo.models import MongoAPI, MongoAuthor, MongoProject
from .mongo.routes import api as mongo_api
from .utils.cache import MemoryCache, RedisCache
from .utils.cleanup import cleanup_tokens
from .utils.validate import validate_token_nullable


async def _background_cleanup_job():
    # Uvicorn does not have a way to run a task only on the main worker,
    # so let's race!
    try:
        lock_file = open("/tmp/woc_cleanup_lock", "w+")
        fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        logger.info(f"Starting background cleanup job on process {os.getpid()}")
    except IOError:
        return

    error_count = 0
    while True:
        try:
            await cleanup_tokens()
            await asyncio.sleep(3600)
        except Exception as e:
            if error_count > 10:
                logger.error("Error in background cleanup job: {}", e)
                raise e
            logger.error("Error in background cleanup job: {}", e)
            error_count += 1
            await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # init woc
    app.state.woc = WocMapsLocal(on_large="ignore")
    # init mongo
    app.state.mongo_client = AsyncMongoClient(settings.mongo.url)
    await init_beanie(
        database=app.state.mongo_client.get_database(),
        document_models=[MongoAPI, MongoAuthor, MongoProject, Token, OneTimeCode, User],
    )
    # init clickhouse
    app.state.ch_client = Ch.from_url(settings.clickhouse.url)
    # init cache
    if settings.auth.get("cache_redis_url"):
        logger.info("Using Redis for token cache")
        app.state.token_cache = RedisCache[str, Token](
            url=settings.auth.get("cache_redis_url"),
            ttl_seconds=settings.auth.get("cache_ttl", 100),
        )
    else:
        logger.info("Redis URL not set, using in-memory token cache")
        app.state.token_cache = MemoryCache[str, Token](
            settings.auth.get("cache_ttl", 100)
        )
    if settings.lookup.get("cache_redis_url"):
        logger.info("Using Redis for lookup cache")
        app.state.lookup_cache = RedisCache[str, Document](
            url=settings.lookup.get("cache_redis_url"),
            ttl_seconds=settings.lookup.get("cache_ttl", 86400),
        )
    else:
        logger.info("Redis URL not set, using in-memory lookup cache")
        app.state.lookup_cache = MemoryCache[str, Document](
            settings.lookup.get("cache_ttl", 100)
        )
    # mount background cleanup job
    app.state.background_cleanup_job = asyncio.create_task(_background_cleanup_job())
    yield
    # close mongo
    await app.state.mongo_client.close()
    # close clickhouse
    app.state.ch_client.disconnect()
    # cancel background cleanup job
    app.state.background_cleanup_job.cancel()


app = FastAPI(title="woc-backend", version="0.1.0", lifespan=lifespan)

# CORS
if settings.cors.get("enabled", False):

    @app.middleware("http")
    async def add_cors_headers(request, call_next):
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = ",".join(
            settings.cors.get("origins", ["*"])
        )
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response


app.include_router(
    lookup_api, prefix="/lookup", dependencies=[Depends(validate_token_nullable)]
)
app.include_router(
    mongo_api, prefix="/mongo", dependencies=[Depends(validate_token_nullable)]
)
app.include_router(
    clickhouse_api,
    prefix="/clickhouse",
    dependencies=[Depends(validate_token_nullable)],
)
app.include_router(auth_api, prefix="/auth")

if __name__ == "__main__":
    parser = argparse.ArgumentParser("Package Dashboard Server")
    parser.add_argument("-p", "--port", default=8234, type=int, help="Port to run on")
    parser.add_argument("-o", "--host", default="0.0.0.0", help="Host to run on")
    parser.add_argument(
        "-r",
        "--reload",
        action="store_true",
        default=False,
        help="Reload on code changes",
    )
    parser.add_argument(
        "--workers",
        default=None,
        type=int,
        help="Number of workers to run",
    )
    args = parser.parse_args()

    logger.info("Starting uvicorn server on port {}", args.port)

    uvicorn.run(
        "woc_backend.__main__:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        proxy_headers=True,
        forwarded_allow_ips="*",
        reload_dirs=["woc_backend"],
        workers=args.workers,
    )
