from datetime import datetime
from enum import Enum
from typing import List, Optional, Tuple, Union

from pydantic import BaseModel


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


class WocFile(BaseModel):
    """Represents a file in the WoC database."""

    path: str
    """Path to the file in the local filesystem."""

    size: Optional[int] = None
    """Size of file in bytes."""

    digest: Optional[str] = None
    """16-char digest calculated by woc.utils.fast_digest."""


class WocObject(BaseModel):
    name: str
    """Name of the map, e.g. 'c2p', 'c2r', 'P2c'."""

    sharding_bits: int
    """Number of bits used for sharding."""


class WocMap(BaseModel):
    name: str
    """Name of the map, e.g. 'c2p', 'c2r', 'P2c'."""

    sharding_bits: int
    """Number of bits used for sharding."""

    version: str
    """version of the map, e.g. 'R', 'U'."""

    dtypes: Tuple[str, str]
    """Data types of the map, e.g. ('h', 'cs'), ('h', 'hhwww')."""
