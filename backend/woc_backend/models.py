from typing import Optional, Generic, TypeVar, Dict, Any
from pydantic import BaseModel

T = TypeVar("T")


class WocResponse(BaseModel, Generic[T]):
    data: T
    errors: Optional[dict] = None
    nextCursor: Optional[int] = None

    class Config:
        json_encoders = {None: lambda x: None, "_id": lambda x: None}
        json_dumps = lambda obj, **kwargs: obj.dict(exclude_none=True, **kwargs)  # Exclude None globally