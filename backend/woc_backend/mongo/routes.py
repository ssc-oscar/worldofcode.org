import json
import sys
import logging
from typing import TYPE_CHECKING, List, Literal, Optional, Union, Dict, Any
from fastapi import Request, HTTPException, APIRouter, Query, Response, Depends
from beanie.operators import Text
from loguru import logger

from ..utils.validate import validate_limit
from .models import MongoAPI, MongoAuthor, MongoProject
from ..models import WocResponse

api = APIRouter()


@api.get(
    "/author/search",
    response_model=WocResponse[List[MongoAuthor]],
    response_model_exclude_none=True,
    dependencies=[Depends(validate_limit)],
)
async def search_author(q: str, limit: int = 10, by: Optional[Literal["email"]] = None):
    """
    Search for authors by email address.
    """
    if by == "email":
        results = await MongoAuthor.find({"emails": q}).limit(limit).to_list()
    else:
        results = (
            await MongoAuthor.find(Text(q, language=None))
            .sort([("score", {"$meta": "textScore"})])
            .limit(limit)
            .to_list()
        )
    return WocResponse[List[MongoAuthor]](data=results)


async def _sample(cls: Union[MongoAuthor, MongoProject, MongoAPI], filter, limit):
    if filter is None:
        filter = {}
    else:
        filter = json.loads(filter)
    # sampling can be slow if it is not the first pipeline:
    # https://stackoverflow.com/questions/37679999/mongodb-aggregation-with-sample-very-slow
    # 1) Sample 1000,20000,200000 documents, then filter
    results = []
    for samples in (1000, 20000, 200000):
        if len(results) >= limit:
            break
        results.extend(
            await cls.aggregate(
                [
                    {"$sample": {"size": samples}},
                    {"$match": filter},
                    {"$limit": limit - len(results)},
                    {"$project": {"_id": 0}},
                ]
            ).to_list()
        )
        logger.debug(f"sampled {len(results)} from {samples}, filter={filter}")

    # 2) fallback to full scan
    if len(results) < limit:
        logger.warning(
            f"falling back to full scan, filter={filter}"
        )
        results.extend(await cls.find(filter).limit(limit - len(results)).to_list())
        logger.debug(f"sampled {len(results)} from full scan, filter={filter}")
    return results


@api.get(
    "/author/sample",
    response_model=WocResponse[List[MongoAuthor]],
    response_model_exclude_none=True,
    dependencies=[Depends(validate_limit)],
)
async def sample_author(limit: int = 10, filter: Optional[str] = None):
    """
    Get a random sample of authors.
    """
    results = await _sample(MongoAuthor, filter, limit)
    return WocResponse[List[MongoAuthor]](data=results)


@api.get(
    "/author/{q}",
    response_model=WocResponse[MongoAuthor],
    response_model_exclude_none=True,
)
async def get_author(q: str):
    """
    Get author information by email address.
    """
    r = await MongoAuthor.find_one({"AuthorID": q})
    if not r:
        raise HTTPException(status_code=404, detail=f"Author not found:{q}")
    return WocResponse[MongoAuthor](data=r)

@api.get(
    "/project/search",
    response_model=WocResponse[List[MongoProject]],
    response_model_exclude_none=True,
    dependencies=[Depends(validate_limit)],
)
async def search_project(q: str, limit: int = 10):
    """
    Search for projects by name.
    """
    results = (
        await MongoProject.find(Text(q, language=None))
        .sort([("score", {"$meta": "textScore"})])
        .limit(limit)
        .to_list()
    )
    return WocResponse[List[MongoProject]](data=results)


@api.get(
    "/project/sample",
    response_model=WocResponse[List[MongoProject]],
    response_model_exclude_none=True,
    dependencies=[Depends(validate_limit)],
)
async def sample_project(limit: int = 10, filter: Optional[str] = None):
    """
    Get a sample of projects.

    :param limit: Maximum number of projects to return.
    :param filter: Optional MongoDB filter. e.g. {"NumCommits" : {"$gt": 100}}
    """
    results = await _sample(MongoProject, filter, limit)
    return WocResponse[List[MongoProject]](data=results)


@api.get(
    "/project/{q}",
    response_model=WocResponse[MongoProject],
    response_model_exclude_none=True,
)
async def get_project(q: str):
    """
    Get project information by name.
    """
    r =await MongoProject.find_one({"ProjectID": q})
    if not r:
        raise HTTPException(status_code=404, detail=f"Project not found: {q}")
    return WocResponse[MongoProject](data=r)

@api.get(
    "/api/search",
    response_model=WocResponse[List[MongoAPI]],
    response_model_exclude_none=True,
    dependencies=[Depends(validate_limit)],
)
async def search_api(q: str, limit: int = 10):
    """
    Search for APIs by name.
    """
    results = (
        await MongoAPI.find(q, language=None)
        .sort([("score", {"$meta": "textScore"})])
        .limit(limit)
        .to_list()
    )
    return WocResponse[List[MongoAPI]](data=results)


@api.get(
    "/api/sample",
    response_model=WocResponse[List[MongoAPI]],
    response_model_exclude_none=True,
    dependencies=[Depends(validate_limit)],
)
async def sample_api(limit: int = 10, filter: Optional[str] = None):
    """
    Get a sample of APIs.

    :param limit: Maximum number of APIs to return.
    :param filter: Optional MongoDB filter. e.g. {"NumCommits" : {"$gt": 100}}
    """
    results = await _sample(MongoAPI, filter, limit)
    return WocResponse[List[MongoAPI]](data=results)


@api.get(
    "/api/{q}", response_model=WocResponse[MongoAPI], response_model_exclude_none=True
)
async def get_api(q: str):
    """
    Get API information by name.
    """
    r = await MongoAPI.find_one({"API": q})
    if not r:
        raise HTTPException(status_code=404, detail=f"API not found:{q}")
    return WocResponse[MongoAPI](data=r)
        
