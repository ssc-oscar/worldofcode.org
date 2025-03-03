from pydantic import BaseModel, Field
from beanie import Document
from typing import Dict

class UserBase(BaseModel):
    name: str = Field(..., example="John Doe")
    token: str = Field(..., example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")
    disabled: bool = False