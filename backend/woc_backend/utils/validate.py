import time
from typing import List, Optional, TYPE_CHECKING
from fastapi.exceptions import RequestValidationError
from fastapi import FastAPI, HTTPException, Query, Depends, Header, Request, Form, Cookie
from pydantic import ValidationError, BaseModel, Field
from pydantic_core import InitErrorDetails, PydanticCustomError
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from httpx import AsyncClient
from loguru import logger

from ..config import settings
from .source import get_client_info
if TYPE_CHECKING:
    from .cache import TTLCache
    
def _raise_422(loc: str, message: str):
    # https://github.com/fastapi/fastapi/discussions/8033#discussioncomment-6532805
    raise RequestValidationError(
        errors=(
            ValidationError.from_exception_data(
                "ValueError",
                [
                    InitErrorDetails(
                        type=PydanticCustomError("value_error", message),
                        loc=("query", loc),
                    )
                ],
            )
        ).errors()
    )


def validate_q_length(q: List[str] = Query(default=[])):
    if len(q) > settings.limit.batch_items:
        _raise_422("q", f"Query parameter 'q' cannot have more than {settings.limit.batch_items} items.")
    return q


def validate_limit(limit: int = Query(default=10)):
    if limit > settings.limit.sql_limit:
        _raise_422("limit", f"Query parameter 'limit' cannot be greater than {settings.limit.sql_limit}.")
    return limit

_security = HTTPBearer(auto_error=False)

async def validate_token_nullable(request: Request, token_header: HTTPAuthorizationCredentials = Depends(_security), token: Optional[str] = Cookie(None)):
    token = token_header.credentials if token_header else token
    if not token:
        return None
    # cache token, this is a frequent operation
    cache: "TTLCache[str,Token]" = request.app.state.cache
    token_obj = cache.get(token)
    if token_obj is None:
        from ..auth.models import Token
        token_obj = await Token.find_one({"_id": token})
        # insert to cache
        cache.set(token, token_obj)
    if not token_obj:
        raise HTTPException(status_code=401, detail="Invalid token.")
    # Check if token is revoked
    if token_obj.revoked:
        raise HTTPException(status_code=401, detail="Invalid token.")
    # Check if token is expired
    if token_obj.expires < time.time():
        raise HTTPException(status_code=401, detail="Token has expired.")
    return token_obj

async def validate_token(request: Request, token_header: HTTPAuthorizationCredentials = Depends(_security), token: Optional[str] = Cookie(None)):
    if token_header is None and token is None:
        raise HTTPException(status_code=401, detail="You are accessing a protected route. Please sign in or provide an API key.")
    return await validate_token_nullable(request, token_header, token)

async def validate_one_time_code(request: Request, state: Optional[str] = None, client_info: dict = Depends(get_client_info)):
    # if state does not exist, log everything and yields an error
    if state is None:
        # try to read form body
        form = await request.form()
        state = form.get("state")
    if state is None:
        logger.warning(f"state is None: {client_info}")
        logger.debug(f"Headers: {request.headers}, Cookies: {request.cookies}, Query: {request.query_params}, Body: {await request.body()}")
        raise HTTPException(status_code=400, detail="Code not found. Please check if the link is correct.")
    # check one_time_code
    from ..auth.models import OneTimeCode
    one_time_code = await OneTimeCode.find_one({"_id": state})
    if one_time_code is None:
        raise HTTPException(status_code=400, detail="Code not found. Please check if the link is correct.")
    if one_time_code.revoked:
        raise HTTPException(status_code=400, detail="Code revoked. This usually means some have tried to authenticate using this link.")
    if one_time_code.expires < int(time.time()):
        raise HTTPException(status_code=400, detail="Code expired. Please try logging in again.")
    
    # check if the client ip and user agent is the same
    if one_time_code.user_agent != client_info["user_agent"] or one_time_code.request_ip != client_info["request_ip"]:
        logger.warning(f"User-Agent or IP mismatch: "
                       f"{one_time_code.request_ip, one_time_code.user_agent} != {client_info['request_ip'], client_info['user_agent']}")
        # just log, don't do anything
    # revoke the code
    logger.debug(f"Revoking one-time code {state}")
    one_time_code.revoked = True
    await one_time_code.save()
    return one_time_code

def get_httpx_client(request: Request):
    if hasattr(request.app.state, "httpx_client") and isinstance(request.app.state.httpx_client, AsyncClient):
        return request.app.state.httpx_client
    return AsyncClient()

# class TurnstileResponse(BaseModel):
#     success: bool
#     challenge_ts: Optional[str]
#     hostname: Optional[str]
#     error_codes: List[str] = Field(alias="error-codes", default_factory=list)
#     action: Optional[str]
#     cdata: Optional[str]
    
async def validate_turnstile(request: Request, cf_turnstile_response: str):
    """
    Validates the reCAPTCHA response from the Cloudflare Turnstile API.
    """
    client_ip = get_client_info(request).get("request_ip")
    httpx_client = get_httpx_client(request)
        
    async with httpx_client:
        response = await httpx_client.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            json={
                "secret": settings.cloudflare.turnstile_secret,
                "response": cf_turnstile_response,
                "remoteip": client_ip
            }
        )
        response.raise_for_status()
        data = response.json()
        if not data.get("success"):
            logger.warning(f"Turnstile failed: {data.get('error-codes')}")
            raise HTTPException(status_code=403, detail="reCAPTCHA validation failed.")
        return data