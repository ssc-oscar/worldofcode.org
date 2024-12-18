from typing import Optional, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class WocResponse(BaseModel, Generic[T]):
    data: T
    errors: Optional[dict] = None
