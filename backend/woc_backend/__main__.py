import argparse
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from loguru import logger
from woc.local import WocMapsLocal
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from .lookup.routes import api as lookup_api
from .mongo.routes import api as mongo_api
from .mongo.models import MongoAPI, MongoAuthor, MongoProject
from .config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.woc = WocMapsLocal()
    client = AsyncIOMotorClient(settings.mongo.url)
    await init_beanie(database=client[settings.mongo.db], document_models=[MongoAPI, MongoAuthor, MongoProject])
    yield
    await client.close()

app = FastAPI(title="woc-backend", version="0.1.0", lifespan=lifespan)
app.include_router(lookup_api, prefix="/lookup")
app.include_router(mongo_api, prefix="/mongo")

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