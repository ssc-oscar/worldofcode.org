from fastapi import FastAPI, HTTPException, Query, Depends
from typing import List

from .config import settings

def validate_q_length(q: List[str] = Query(default=[])):
    if len(q) > settings.limit.batch_items:
        raise HTTPException(
            status_code=422, 
            detail=f"Query parameter 'q' cannot have more than {settings.limit.batch_items} items."
        )
    return q

def validate_limit(limit: int = Query(default=10)):
    if limit > settings.limit.sql_limit:
        raise HTTPException(
            status_code=422, 
            detail=f"Query parameter 'limit' cannot be more than {settings.limit.sql_limit}."
        )
    return limit