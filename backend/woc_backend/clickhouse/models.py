from pydantic import BaseModel
from typing import List
from enum import Enum

class ClickhouseCommit(BaseModel):
    hash: str
    timestamp: int
    tree: str
    author: str
    parent: str
    comment: str
    content: str

class ClickhouseBlobDeps(BaseModel):
    blob: str
    commit: str
    project: str
    timestamp: int
    author: str
    language: "ClickhouseLanguage"
    deps: List[str]

class ClickhouseLanguage(str, Enum):
    Java = "java"
    Ruby = "rb"
    Csharp = "Cs"
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
    C = "C"
    R = "R"
    TypeScript = "TypeScript"

    def __str__(self) -> str:
        return self.value