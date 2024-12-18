from typing import Optional, List, Union, Literal, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from beanie import Document
from enum import Enum


class _GitObject(BaseModel):
    hash: str


class _NamedObject(BaseModel):
    name: str


class Author(_NamedObject):
    email: str


class Blob(_GitObject):
    length: int
    content: str


class Commit(_GitObject):
    author: Author
    authored_at: datetime
    committer: Author
    committed_at: datetime
    tree: str
    parents: List[str]
    message: str


class File(_NamedObject):
    path: str


class Tree(_GitObject):
    entries: List[Union[str, Union[str, "Tree"]]]


class ObjectName(str, Enum):
    blob = "blob"
    commit = "commit"
    tree = "tree"

    def __str__(self) -> str:
        return self.value
