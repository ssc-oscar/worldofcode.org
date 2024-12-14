from typing import Optional, Generic, TypeVar
from pydantic.generics import GenericModel

T = TypeVar("T")

class WocResponse(GenericModel, Generic[T]):
    data: T
    errors: Optional[dict] = None