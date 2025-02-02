from fastapi import FastAPI, HTTPException, Query, Depends
from typing import List
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from pydantic_core import InitErrorDetails, PydanticCustomError

from .config import settings

def _raise_422(loc: str, message: str):
    # https://github.com/fastapi/fastapi/discussions/8033#discussioncomment-6532805
    raise RequestValidationError(
        errors=(
            ValidationError.from_exception_data(
                "ValueError",
                [
                    InitErrorDetails(
                        type=PydanticCustomError("value_error", message),
                        loc=("query", loc),
                    )
                ],
            )
        ).errors()
    )


def validate_q_length(q: List[str] = Query(default=[])):
    if len(q) > settings.limit.batch_items:
        _raise_422("q", f"Query parameter 'q' cannot have more than {settings.limit.batch_items} items.")
    return q


def validate_limit(limit: int = Query(default=10)):
    if limit > settings.limit.sql_limit:
        _raise_422("limit", f"Query parameter 'limit' cannot be greater than {settings.limit.sql_limit}.")
    return limit
