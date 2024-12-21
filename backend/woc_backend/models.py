from typing import Optional, Generic, TypeVar, Dict, Any
from pydantic import BaseModel

T = TypeVar("T")


class WocResponse(BaseModel, Generic[T]):
    data: T
    errors: Optional[dict] = None
    nextCursor: Optional[int] = None