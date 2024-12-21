from typing import TYPE_CHECKING, List, Union
from fastapi import Request, HTTPException, APIRouter, Query, Response, Depends
from .models import MongoAPI, MongoAuthor, MongoProject
from ..models import WocResponse

api = APIRouter()


@api.get("/author/search", response_model=WocResponse[List[MongoAuthor]], response_model_exclude_none=True)
async def search_author(q: str, limit: int = 10):
    """
    Search for authors by email address.
    """
    results = await MongoAuthor.find({"$text": {"$search": q}}).limit(limit).to_list()
    return WocResponse[List[MongoAuthor]](data=results)


@api.get("/author/{q}", response_model=WocResponse[MongoAuthor], response_model_exclude_none=True)
async def get_author(q: str):
    """
    Get author information by email address.
    """
    try:
        return WocResponse[MongoAuthor](data=await MongoAuthor.find_one({"AuthorID": q}))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=e.args[0])


@api.get("/project/search", response_model=WocResponse[List[MongoProject]], response_model_exclude_none=True)
async def search_project(q: str, limit: int = 10):
    """
    Search for projects by name.
    """
    results = await MongoProject.find({"$text": {"$search": q}}).limit(limit).to_list()
    return WocResponse[List[MongoProject]](data=results)


@api.get("/project/{q}", response_model=WocResponse[MongoProject], response_model_exclude_none=True)
async def get_project(q: str):
    """
    Get project information by name.
    """
    print("getting project", q)
    try:
        return WocResponse[MongoProject](
            data=await MongoProject.find_one({"ProjectID": q})
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=e.args[0])


@api.get("/api/search", response_model=WocResponse[List[MongoAPI]], response_model_exclude_none=True)
async def search_api(q: str, limit: int = 10):
    """
    Search for APIs by name.
    """
    results = await MongoAPI.find({"$text": {"$search": q}}).limit(limit).to_list()
    return WocResponse[List[MongoAPI]](data=results)


@api.get("/api/{q}", response_model=WocResponse[MongoAPI], response_model_exclude_none=True)
async def get_api(q: str):
    """
    Get API information by name.
    """
    try:
        return WocResponse[MongoAPI](data=await MongoAPI.find_one({"API": q}))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=e.args[0])
