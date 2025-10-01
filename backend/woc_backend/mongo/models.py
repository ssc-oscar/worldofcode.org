from enum import Enum
from typing import Any, Dict, List, Optional

from beanie import Document, Indexed
from pydantic import Field


class MongoLanguage(str, Enum):
    IPython = "ipy"
    Ruby = "Ruby"
    TypeScript = "TypeScript"
    SQL = "Sql"
    Swift = "Swift"
    Cobol = "Cobol"
    OCaml = "OCaml"
    Kotlin = "Kotlin"
    Ada = "Ada"
    Erlang = "Erlang"
    Perl = "Perl"
    Julia = "Julia"
    FML = "fml"
    Basic = "Basic"
    Dart = "Dart"
    C_CPP = "C/C++"
    Lisp = "Lisp"
    Java = "Java"
    JavaScript = "JavaScript"
    Other = "other"
    Python = "Python"
    Clojure = "Clojure"
    Rust = "Rust"
    PHP = "PHP"
    R = "R"
    Go = "Go"
    Fortran = "Fortran"
    Lua = "Lua"
    Scala = "Scala"

    def __str__(self):
        return self.value


class MongoAuthor(Document):
    Alias: List[str] = Field(default_factory=list)
    AuthorID: str = Indexed(sparse=True)
    EarliestCommitDate: int = -1
    FileInfo: Dict[MongoLanguage, int] = Field(default_factory=dict)
    Gender: Optional[str] = None
    LatestCommitDate: int = -1
    MonNcm: Dict[str, int] = Field(default_factory=dict)
    MonNprj: Dict[str, int] = Field(default_factory=dict)
    NumActiveMon: int = -1
    NumAlias: int = -1
    NumCommits: int = -1
    NumFiles: int = -1
    NumOriginatingBlobs: int = -1
    NumProjects: int = -1

    class Settings:
        name = "A_metadata.V3"


class MongoAPI(Document):
    API: str = Indexed(sparse=True)
    EarliestCommitDate: int = -1
    FileInfo: Dict[MongoLanguage, int] = Field(default_factory=dict)
    LatestCommitDate: int = -1
    NumAuthors: int = -1
    NumCommits: int = -1
    NumProjects: int = -1

    class Settings:
        name = "API_metadata.V"


class MongoProject(Document):
    CommunitySize: int = -1
    Core: Dict[str, Any] = Field(default_factory=dict)
    EarliestCommitDate: int = -1
    FileInfo: Dict[MongoLanguage, int] = Field(default_factory=dict)
    LatestCommitDate: int = -1
    MonNauth: Dict[str, int] = Field(default_factory=dict)
    MonNcm: Dict[str, int] = Field(default_factory=dict)
    NumActiveMon: int = -1
    NumAuthors: int = -1
    NumBlobs: int = -1
    NumCommits: int = -1
    NumCore: int = -1
    NumFiles: int = -1
    NumForks: int = -1
    NumProjects: int = -1
    ProjectID: str = Indexed(sparse=True)

    class Settings:
        name = "P_metadata.V3"
