import sys
from typing import TYPE_CHECKING, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from loguru import logger

from ..config import settings
from ..models import WocResponse
from ..utils.validate import validate_limit
from .models import ClickhouseBlobDeps, ClickhouseCommit, ClickhouseLanguage

if TYPE_CHECKING:
    from clickhouse_driver import Client as Ch

api = APIRouter()


def _build_commits_query(**kwargs: Any) -> str:
    """
    Extract the query builder to a separate function and use parameters to avoid SQL injection.
    """
    if kwargs["count"]:
        select = "COUNT(*)"
    else:
        select = "lower(hex(sha1)) AS sha1, time, lower(hex(tree)) AS tree, author, lower(hex(parent)) AS parent, comment"

    where_clauses = []
    params = {}
    if kwargs["start"] is not None:
        where_clauses.append("time >= %(start)s")
        params["start"] = kwargs["start"]
    if kwargs["end"] is not None:
        where_clauses.append("time <= %(end)s")
        params["end"] = kwargs["end"]
    if kwargs["author"] is not None:
        where_clauses.append("match(author, %(author)s)")
        params["author"] = kwargs["author"]
    if kwargs["project"] is not None:
        where_clauses.append("match(project, %(project)s)")
        params["project"] = kwargs["project"]
    if kwargs["comment"] is not None:
        where_clauses.append("match(comment, %(comment)s)")
        params["comment"] = kwargs["comment"]

    where = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    if kwargs["limit"]:
        limit = "LIMIT %(limit)s"
        params["limit"] = kwargs["limit"]
        if "offset" in kwargs and kwargs["offset"] > 0:
            limit += " OFFSET %(offset)s"
            params["offset"] = kwargs["offset"]
    else:
        limit = ""
    q = (
        f"SELECT {select} FROM {settings.clickhouse.table_commits} {where} {limit}",
        params,
    )
    logger.debug("Generated Clickhouse query: {}", q)
    return q


@api.get(
    "/commits",
    response_model=WocResponse[List[ClickhouseCommit]],
    response_model_exclude_none=True,
    dependencies=[Depends(validate_limit)],
)
def get_commits(
    request: Request,
    start: int = Query(None, ge=0),
    end: int = Query(None, ge=0),
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    author: str = Query(None),
    project: str = Query(None),
    comment: str = Query(None),
):
    """
    Get commits by time range, author, project, or comment.

    :param start: Start time in Unix timestamp.
    :param end: End time in Unix timestamp.
    :param limit: Maximum number of commits to return.
    :param offset: Offset for pagination.
    :param author: Author email address (text search).
    :param project: Project name (text search).
    :param comment: Commit message (text search).

    :return: List of commits in: sha1, timestamp, tree, author, parent, comment, content.
    """
    ch_client: Ch = request.app.state.ch_client
    if all(param is None for param in [start, end, author, project, comment]):
        raise HTTPException(
            status_code=400,
            detail="You must specify at least one of: start, end, author, project, comment.",
        )

    q = _build_commits_query(
        start=start,
        end=end,
        author=author,
        project=project,
        comment=comment,
        limit=limit,
        count=False,
        offset=offset,
    )
    try:
        r = ch_client.execute(*q)
        print(r, file=sys.stderr)
        return WocResponse(
            data=[
                ClickhouseCommit(
                    hash=row[0],
                    timestamp=row[1],
                    tree=row[2],
                    author=row[3],
                    parent=row[4],
                    comment=row[5],
                )
                for row in r
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api.get(
    "/commits/count",
    response_model=WocResponse[int],
    response_model_exclude_none=True,
)
def count_commits(
    request: Request,
    start: int = Query(None, ge=0),
    end: int = Query(None, ge=0),
    author: str = Query(None),
    project: str = Query(None),
    comment: str = Query(None),
):
    """
    Count commits by time range, author, project, or comment.

    :param start: Start time in Unix timestamp.
    :param end: End time in Unix timestamp.
    :param author: Author email address (text search).
    :param project: Project name (text search).
    :param comment: Commit message (text search).

    :return: count of commits.
    """
    ch_client = request.app.state.ch_client

    q = _build_commits_query(
        start=start,
        end=end,
        author=author,
        project=project,
        comment=comment,
        count=True,
    )
    try:
        return WocResponse(data=ch_client.execute(*q)[0][0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_deps_query(**kwargs: Any) -> str:
    """
    Extract the query builder to a separate function and use parameters to avoid SQL injection.
    """
    if kwargs["count"]:
        select = "COUNT(*)"
    else:
        select = "lower(hex(blob)) AS blob, lower(hex(commit)) AS commit, project, time, author, language, deps"

    where_clauses = []
    params = {}
    if kwargs["start"] is not None:
        where_clauses.append("time >= %(start)s")
        params["start"] = kwargs["start"]
    if kwargs["end"] is not None:
        where_clauses.append("time <= %(end)s")
        params["end"] = kwargs["end"]
    if kwargs["author"] is not None:
        where_clauses.append("author = %(author)s")
        params["author"] = kwargs["author"]
    if kwargs["language"] is not None:
        where_clauses.append("language = %(language)s")
        params["language"] = kwargs["language"]
    if kwargs["blob"] is not None:
        where_clauses.append("blob = unhex(%(blob)s)")
        params["blob"] = kwargs["blob"]
    if kwargs["project"] is not None:
        where_clauses.append("project = %(project)s")
        params["project"] = kwargs["project"]
    # match '^{dep) or ';(dep): too slow for now
    # if kwargs["deps"]:
    #     where_clauses.append(f"match(deps, '^{re.escape(kwargs['deps'])}|;{re.escape(kwargs['deps'])}')")
    # if kwargs["deps"]:
    #     where_clauses.append("deps = %(deps)s")
    if kwargs["deps"] is not None:
        where_clauses.append("has(imports, %(deps)s)")
        params["deps"] = kwargs["deps"]
    where = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    if "limit" in kwargs and kwargs["limit"] > 0:
        limit = "LIMIT %(limit)s"
        params["limit"] = kwargs["limit"]
        if "offset" in kwargs and kwargs["offset"] > 0:
            limit += " OFFSET %(offset)s"
            params["offset"] = kwargs["offset"]
    else:
        limit = ""
    q = (
        f"SELECT {select} FROM {settings.clickhouse.table_deps} {where} {limit}",
        params,
    )
    logger.debug("Generated CLickhouse query: {}", q)
    return q


@api.get(
    "/deps",
    response_model=WocResponse[List[ClickhouseBlobDeps]],
    response_model_exclude_none=True,
    dependencies=[Depends(validate_limit)],
)
def get_deps(
    request: Request,
    start: int = Query(None, ge=0),
    end: int = Query(None, ge=0),
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    blob: Optional[str] = Query(None),
    language: Optional[ClickhouseLanguage] = Query(None),
    author: str = Query(None),
    deps: str = Query(None),
    project: str = Query(None),
):
    """
    Get blobs-dependencies by time range, author, project, language, or dependency.

    :param start: Start time in Unix timestamp.
    :param end: End time in Unix timestamp.
    :param limit: Maximum number of dependencies to return.
    :param offset: Offset for pagination.
    :param blob: Blob key.
    :param language: Programming language.
    :param author: Author name and email address.
    :param deps: Dependency name.
    :param project: Project name.

    :return: List of blobs in: blob, commit, project, timestamp, author, language, deps.
    """
    ch_client = request.app.state.ch_client

    if all(
        param is None for param in [blob, start, end, language, author, deps, project]
    ):
        raise HTTPException(
            status_code=400,
            detail="You must specify at least one of: start, end, language, author, deps, project.",
        )

    q = _build_deps_query(
        start=start,
        end=end,
        language=language,
        author=author,
        deps=deps,
        project=project,
        limit=limit,
        count=False,
        blob=blob,
        offset=offset,
    )
    try:
        r = ch_client.execute(*q)
        return WocResponse(
            data=[
                ClickhouseBlobDeps(
                    blob=row[0],
                    commit=row[1],
                    project=row[2],
                    timestamp=row[3],
                    author=row[4],
                    language=row[5],
                    deps=row[6].split(";"),
                )
                for row in r
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api.get(
    "/deps/count",
    response_model=WocResponse[int],
    response_model_exclude_none=True,
)
def count_deps(
    request: Request,
    start: int = Query(None, ge=0),
    end: int = Query(None, ge=0),
    blob: str = Query(None),
    language: Optional[ClickhouseLanguage] = Query(None),
    author: str = Query(None),
    deps: str = Query(None),
    project: str = Query(None),
):
    """
    Count blobs-dependencies by time range, author, project, language, or dependency.

    :param start: Start time in Unix timestamp.
    :param end: End time in Unix timestamp.
    :param limit: Maximum number of dependencies to return.
    :param blob: Blob key.
    :param language: Programming language.
    :param author: Author name and email address.
    :param deps: Dependency name.
    :param project: Project name.

    :return: count of blobs.
    """
    ch_client = request.app.state.ch_client

    q = _build_deps_query(
        start=start,
        end=end,
        language=str(language),
        author=author,
        deps=deps,
        project=project,
        count=True,
        blob=blob,
    )
    try:
        return WocResponse(data=ch_client.execute(*q)[0][0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
