from dataclasses import asdict
from typing import (
    TYPE_CHECKING,
    Callable,
    List,
    Optional,
    TypeVar,
    Union,
    cast,
)

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from woc.local import (
    decode_commit,
    decode_str,
    decode_tree,
    decode_value,
    decomp_or_raw,
)

from ..models import WocResponse
from ..utils.cache import AbstractCache
from ..utils.validate import validate_q_length
from .models import ObjectName, WocMap, WocObject

if TYPE_CHECKING:
    from woc.local import WocMapsLocal


api = APIRouter()

T = TypeVar("T")


def _get_lookup_cache(request: Request) -> Optional[AbstractCache[str, T]]:
    return cast(
        Optional[AbstractCache[str, T]],
        getattr(request.app.state, "lookup_cache", None),
    )


def _use_lookup_cache(
    request: Request,
    cache_key: str,
    producer: Callable[[], T],
    ttl: Optional[int] = None,
) -> T:
    cache = _get_lookup_cache(request)
    if cache is None:
        return producer()
    cached = cache.get(cache_key)
    if cached is not None:
        return cast(T, cached)
    value = producer()
    cache.put(cache_key, value, ttl=ttl)
    return value


def _object_cache_key(type_: ObjectName, key: str, raw: bool, traverse: bool) -> str:
    return f"object:{type_}:{key}:raw:{int(raw)}:trav:{int(traverse)}"


def _map_cache_key(map_name: str, key: str, cursor: int) -> str:
    return f"map:{map_name}:{key}:cursor:{cursor}"


def _large_object_warning(map_: str, key: str, next_cursor: int) -> str:
    return (
        f"Warning: {key} is a large object, "
        f"use /lookup/map/{map_}/{key}?cursor={next_cursor} to get the rest of the content."
    )


def _traverse_tree(woc: "WocMapsLocal", key: str):
    _ret = []
    for mode, fname, sha in woc.show_content("tree", key):
        if mode != "40000":
            _ret.append((mode, fname, sha))
        else:
            _ret.append((mode, fname, _traverse_tree(woc, sha)))
    return _ret


def _show_content(
    woc: "WocMapsLocal",
    type_: ObjectName,
    key: str,
    raw: bool = False,
    traverse: bool = False,
):
    if type_ != ObjectName.blob and raw:
        return decode_str(decomp_or_raw(woc._get_tch_bytes(type_, key)[0]))
    if type_ == ObjectName.tree and traverse:
        return _traverse_tree(woc, key)
    return woc.show_content(str(type_), key)


@api.get(
    "/object",
    response_model=WocResponse[List[WocObject]],
    response_model_exclude_none=True,
)
def get_objects(request: Request):
    """
    Get the list of available objects.
    """
    woc: WocMapsLocal = request.app.state.woc
    data = _use_lookup_cache(
        request,
        "objects",
        lambda: [asdict(o) for o in woc.objects],
    )
    return WocResponse[List[WocObject]](data=data)


@api.get(
    "/object/{type_}",
    response_model=WocResponse[dict],
    response_model_exclude_none=True,
    dependencies=[Depends(validate_q_length)],
)
def show_contents(
    request: Request, type_: ObjectName, q: List[str] = Query(...), raw: bool = False
):
    """
    Show the contents of a batch of objects of a commit, tree, or blob.

    :param q: List of object keys to show. There is a limit on the number of items in the list.
    :param raw: If True, return the raw object in strings; otherwise, return the parsed content in tuples.
    """
    woc: WocMapsLocal = request.app.state.woc
    ret = {}
    errors = {}
    for key in q:
        try:
            ret[key] = _use_lookup_cache(
                request,
                _object_cache_key(type_, key, raw, False),
                lambda key=key: _show_content(woc, type_, key, raw=raw),
            )
        except (KeyError, ValueError) as e:
            errors[key] = e.args[0]
    return WocResponse(data=ret, errors=errors if errors else None)


@api.get(
    "/object/{type_}/count",
    response_model=WocResponse[int],
    response_model_exclude_none=True,
)
def count_objects(request: Request, type_: ObjectName):
    """
    Count the number of objects of a commit, tree, or blob.
    """
    woc: WocMapsLocal = request.app.state.woc
    try:
        count = _use_lookup_cache(
            request,
            f"count:object:{type_}",
            lambda: woc.count(str(type_)),
        )
        return WocResponse[int](data=count)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=e.args[0])


def _get_values_with_cursor(
    woc: "WocMapsLocal", map_name: str, key: str, cursor: int = 0
):
    _bytes, decode_dtype, next_cursor = woc._get_tch_bytes(map_name, key, cursor)
    if map_name == "commit.tch":
        _decoded = [decode_commit(decomp_or_raw(_bytes))]
    elif map_name == "tree.tch":
        _decoded = [decode_tree(decomp_or_raw(_bytes))]
    else:
        _decoded = decode_value(_bytes, decode_dtype)
    return _decoded, next_cursor


@api.get(
    "/object/{type_}/{key}",
    response_model=Union[WocResponse[Union[str, list]], str],
    response_model_exclude_none=True,
)
def show_content(
    request: Request,
    type_: ObjectName,
    key: str,
    raw: bool = False,
    traverse: bool = False,
):
    """
    Show the content of a single object of a commit, tree, or blob.

    :param key: Object key to show.
    :param raw: If True, return the raw object; otherwise, return the parsed content in tuples.
    :param traverse: If True, traverse the tree object. won't work for raw trees.
    """
    woc: WocMapsLocal = request.app.state.woc
    try:
        if raw is True:
            content = _use_lookup_cache(
                request,
                _object_cache_key(type_, key, True, False),
                lambda: _show_content(woc, type_, key, raw=True),
            )
            return Response(content=content, media_type="text/plain")
        return WocResponse(
            data=_use_lookup_cache(
                request,
                _object_cache_key(type_, key, False, traverse),
                lambda: _show_content(woc, type_, key, raw=False, traverse=traverse),
            )
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=e.args[0])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=e.args[0])


@api.get(
    "/map",
    response_model=WocResponse[List[WocMap]],
    response_model_exclude_none=True,
)
def get_maps(request: Request):
    """
    Get the list of available maps.
    """
    woc: WocMapsLocal = request.app.state.woc
    data = _use_lookup_cache(
        request,
        "maps",
        lambda: [asdict(m) for m in woc.maps],
    )
    return WocResponse[List[WocMap]](data=data)


@api.get(
    "/map/{map_}",
    dependencies=[Depends(validate_q_length)],
    response_model=WocResponse,
    response_model_exclude_none=True,
)
def get_values(request: Request, map_: str, q: List[str] = Query(...)):
    """
    Get the values of a batch of keys from a map.

    The map can be any of the following:
    c2fbb obb2cf bb2cf a2f A2f P2a b2P b2f a2P b2fa b2tac c2p c2cc p2a A2a a2A c2dat
    a2c P2c P2p c2P p2P A2c A2P P2A a2p A2b A2fb P2b P2fb c2b p2c
    Check https://github.com/woc-hack/tutorial for the complete list.

    :param q: List of object keys to show. There is a limit on the number of items in the list.
    """
    woc: WocMapsLocal = request.app.state.woc
    ret = {}
    errors = {}
    map_name = str(map_)
    for key in q:
        try:
            ret[key], next_cursor = _use_lookup_cache(
                request,
                _map_cache_key(map_name, key, 0),
                lambda key=key: _get_values_with_cursor(woc, map_name, key),
            )
            if next_cursor is not None:
                errors[key] = _large_object_warning(map_, key, next_cursor)
        except (KeyError, ValueError) as e:
            errors[key] = e.args[0]
    return WocResponse(data=ret, errors=errors if errors else None)


@api.get(
    "/map/{map_}/count",
    response_model=WocResponse[int],
    response_model_exclude_none=True,
)
def count_values(request: Request, map_: str):
    """
    Count the number of values in a map.

    The map can be any of the following:
    c2fbb obb2cf bb2cf a2f A2f P2a b2P b2f a2P b2fa b2tac c2p c2cc p2a A2a a2A c2dat
    a2c P2c P2p c2P p2P A2c A2P P2A a2p A2b A2fb P2b P2fb c2b p2c
    Check
    """
    woc: WocMapsLocal = request.app.state.woc
    try:
        count = _use_lookup_cache(
            request,
            f"count:map:{map_}",
            lambda: woc.count(map_),
        )
        return WocResponse[int](data=count)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=e.args[0])


@api.get(
    "/map/{map_}/{key}",
    response_model=WocResponse,
    response_model_exclude_none=True,
)
def get_value(request: Request, map_: str, key: str, cursor: int = 0):
    """
    Get the value of a key from a map.

    The map can be any of the following:
    c2fbb obb2cf bb2cf a2f A2f P2a b2P b2f a2P b2fa b2tac c2p c2cc p2a A2a a2A c2dat
    a2c P2c P2p c2P p2P A2c A2P P2A a2p A2b A2fb P2b P2fb c2b p2c
    Check https://github.com/woc-hack/tutorial for the complete list.

    :param cursor: Cursor of the large object.
    """
    woc: WocMapsLocal = request.app.state.woc
    map_name = str(map_)
    try:
        ret, next_cursor = _use_lookup_cache(
            request,
            _map_cache_key(map_name, key, cursor),
            lambda key=key, cursor=cursor: _get_values_with_cursor(
                woc, map_name, key, cursor
            ),
        )
        return WocResponse(data=ret, nextCursor=next_cursor)
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=404, detail=e.args[0])
