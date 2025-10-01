from enum import Enum
from typing import List

from pydantic import BaseModel


class ClickhouseCommit(BaseModel):
    hash: str
    timestamp: int
    tree: str
    author: str
    parent: str
    comment: str


class ClickhouseBlobDeps(BaseModel):
    blob: str
    commit: str
    project: str
    timestamp: int
    author: str
    language: "ClickhouseLanguage"
    deps: List[str]


class ClickhouseLanguage(str, Enum):
    Java = "Java"
    Ruby = "rb"
    CSharp = "Cs"
    Perl = "pl"
    Python = "PY"
    Go = "Go"
    Scala = "Scala"
    JavaScript = "JS"
    Matlab = "F"
    Julia = "jl"
    IPython = "ipy"
    Rust = "Rust"
    Dart = "Dart"
    Kotlin = "Kotlin"
    C_CPP = "C"
    R = "R"
    TypeScript = "TypeScript"

    def __str__(self) -> str:
        return self.value
