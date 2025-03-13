import argparse
import uvicorn
import shortuuid
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from loguru import logger
from woc.local import WocMapsLocal
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from clickhouse_driver import Client as Ch

from .config import settings
from .lookup.routes import api as lookup_api
from .mongo.routes import api as mongo_api
from .mongo.models import MongoAPI, MongoAuthor, MongoProject
from .auth.routes import api as auth_api
from .auth.models import Token, OneTimeCode, User
from .clickhouse.routes import api as clickhouse_api
from .utils.cache import TTLCache


@asynccontextmanager
async def lifespan(app: FastAPI):
    # init woc
    app.state.woc = WocMapsLocal(on_large="ignore")
    # init mongo
    app.state.mongo_client = AsyncIOMotorClient(settings.mongo.url)
    await init_beanie(
        database=app.state.mongo_client.get_database(),
        document_models=[MongoAPI, MongoAuthor, MongoProject, Token, OneTimeCode, User],
    )
    # init clickhouse
    app.state.ch_client = Ch.from_url(settings.clickhouse.url)
    # init cache
    app.state.token_cache = TTLCache(settings.auth.get("cache_ttl", 100))
    yield
    # close mongo
    app.state.mongo_client.close()
    # close clickhouse
    app.state.ch_client.disconnect()


app = FastAPI(title="woc-backend", version="0.1.0", lifespan=lifespan)

# # SESSION
# app.add_middleware(SessionMiddleware, secret_key=settings.auth.get("session_secret", shortuuid.uuid()))
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


app.include_router(lookup_api, prefix="/lookup")
app.include_router(mongo_api, prefix="/mongo")
app.include_router(clickhouse_api, prefix="/clickhouse")
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
    args = parser.parse_args()

    logger.info("Starting uvicorn server on port {}", args.port)

    uvicorn.run(
        "woc_backend.__main__:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )
