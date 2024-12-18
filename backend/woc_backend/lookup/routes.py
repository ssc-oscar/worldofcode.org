from typing import TYPE_CHECKING, List, Union, Dict
from fastapi import Request, HTTPException, APIRouter, Query, Response, Depends
from woc.local import decode_str, decomp_or_raw

from ..models import WocResponse
from .models import ObjectName
from ..common import validate_q_length

if TYPE_CHECKING:
    from woc.local import WocMapsLocal

api = APIRouter()


def _show_content(woc: "WocMapsLocal", type_: ObjectName, key: str, raw: bool = False):
    if type_ != ObjectName.blob and raw:
        return decode_str(decomp_or_raw(woc._get_tch_bytes(type_, key)[0]))
    return woc.show_content(str(type_), key)


@api.get(
    "/object/{type_}",
    response_model=WocResponse[dict],
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
            ret[key] = _show_content(woc, type_, key, raw)
        except (KeyError, ValueError) as e:
            errors[key] = e.args[0]
    return WocResponse[dict](data=ret, errors=errors if errors else None)


@api.get(
    "/object/{type_}/{key}", response_model=Union[WocResponse[Union[str, list]], str]
)
def show_content(request: Request, type_: ObjectName, key: str, raw: bool = False):
    """
    Show the content of a single object of a commit, tree, or blob.

    :param key: Object key to show.
    :param raw: If True, return the raw object; otherwise, return the parsed content in tuples.
    """
    woc: WocMapsLocal = request.app.state.woc
    try:
        if raw is True:
            return Response(
                content=_show_content(woc, type_, key, raw=True), media_type="text/plain"
            )
        return WocResponse[Union[str, list]](data=woc.show_content(str(type_), key))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=e.args[0])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=e.args[0])


@api.get(
    "/map/{map_}",
    dependencies=[Depends(validate_q_length)],
    response_model=WocResponse[Dict[str, list]],
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
    for key in q:
        try:
            ret[key] = woc.get_values(str(map_), key)
        except (KeyError, ValueError) as e:
            errors[key] = e.args[0]
    return WocResponse[Dict[str, list]](data=ret, errors=errors if errors else None)


@api.get("/map/{map_}/{key}", response_model=WocResponse[list])
def get_value(request: Request, map_: str, key: str):
    """
    Get the value of a key from a map.

    The map can be any of the following:
    c2fbb obb2cf bb2cf a2f A2f P2a b2P b2f a2P b2fa b2tac c2p c2cc p2a A2a a2A c2dat
    a2c P2c P2p c2P p2P A2c A2P P2A a2p A2b A2fb P2b P2fb c2b p2c
    Check https://github.com/woc-hack/tutorial for the complete list.

    :param key: Object key to show.
    """
    woc: WocMapsLocal = request.app.state.woc
    try:
        return WocResponse[list](data=woc.get_values(str(map_), key))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=e.args[0])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=e.args[0])
