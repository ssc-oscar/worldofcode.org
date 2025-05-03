from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class WocResponse(BaseModel, Generic[T]):
    data: T
    errors: Optional[dict] = None
    nextCursor: Optional[int] = None

    class Config:
        json_encoders = {None: lambda x: None, "_id": lambda x: None}
