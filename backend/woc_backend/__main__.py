import argparse
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from loguru import logger
from woc.local import WocMapsLocal
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from clickhouse_driver import Client as Ch

from .config import settings
from .lookup.routes import api as lookup_api
from .mongo.routes import api as mongo_api
from .mongo.models import MongoAPI, MongoAuthor, MongoProject
from .clickhouse.routes import api as clickhouse_api


@asynccontextmanager
async def lifespan(app: FastAPI):
    # init woc
    app.state.woc = WocMapsLocal(exclude_larges=True)
    # init mongo
    app.state.mongo_client = AsyncIOMotorClient(settings.mongo.url)
    await init_beanie(
        database=app.state.mongo_client[settings.mongo.db],
        document_models=[MongoAPI, MongoAuthor, MongoProject],
    )
    # init clickhouse
    app.state.ch_client = Ch(
        host=settings.clickhouse.host,
        database=settings.clickhouse.db,
    )
    yield
    # close mongo
    app.state.mongo_client.close()
    # close clickhouse
    app.state.ch_client.disconnect()


app = FastAPI(title="woc-backend", version="0.1.0", lifespan=lifespan)
app.include_router(lookup_api, prefix="/lookup")
app.include_router(mongo_api, prefix="/mongo")
app.include_router(clickhouse_api, prefix="/clickhouse")

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
    logger.info("Starting uvicorn server on port %d", args.port)

    uvicorn.run(
        "woc_backend.__main__:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )
