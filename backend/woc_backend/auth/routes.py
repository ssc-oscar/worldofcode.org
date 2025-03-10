import time
from urllib.parse import urlencode
from typing import TYPE_CHECKING, List, Union, Dict, Any, Tuple, Optional, Literal
from fastapi import Request, HTTPException, APIRouter, Query, Response, Depends, Form
from fastapi.responses import RedirectResponse, JSONResponse
import shortuuid
from loguru import logger
import jinja2

from ..models import WocResponse
from .models import User, Token, OneTimeCode
from ..config import settings
from ..utils.validate import validate_token, validate_turnstile, get_httpx_client, validate_one_time_code
from ..utils.source import get_client_info, get_base_url
from ..utils.email import send_email

api = APIRouter()

async def _create_user(provider_id: str, name: str, client_info: dict):
    user = User(
        id=shortuuid.uuid(),
        name=name,
        provider_id=provider_id,
        **client_info
    )
    logger.info(f"Created user {user.id}, {name} with provider_id {provider_id}")
    await user.save()
    return user

async def _create_token(user_id: str, client_info: dict, token_type: Literal["session", "api"] = "session"):
    _expires_at = int(time.time())
    if token_type == "session":
        _expires_at += int(settings.auth.get("session_ttl", 24*60*60))
    else:
        _expires_at += int(settings.auth.get("api_ttl", 90*24*60*60))
    token = Token(
        id=f"woc-{shortuuid.uuid()}-{user_id}",
        user_id=user_id,
        expires=_expires_at,
        token_type=token_type,
        **client_info
    )
    logger.info(f"Created token {token.id} for user {user_id}, expires at {_expires_at}")
    await token.save()
    return token

async def _create_one_time_code(provider_id: str, client_info: dict):
    _expires_at = int(time.time()) + settings.auth.get("code_ttl", 10*60)
    one_time_code = OneTimeCode(
        id=shortuuid.uuid(),
        provider_id=provider_id,
        expires=_expires_at,
        **client_info
    )
    await one_time_code.save()
    logger.info(f"Creating one time code {one_time_code.id} for {provider_id}, expires at {_expires_at}")
    return one_time_code

async def _generate_login_response(provider_id: str, client_info: dict, name: str, base_url: str):
    user = await User.find_one({"provider_id": provider_id})
    if user is None:
        user = await _create_user(provider_id, name, client_info)
    # create a session token and redirect with the cookie set
    token = await _create_token(user.id, client_info, "session")
    # return a redirect response
    redirect_url = settings.get("web_url") or base_url
    r = RedirectResponse(redirect_url)
    # parse domain from redirect_url
    domain = redirect_url.split("//")[-1].split("/")[0]
    r.set_cookie("token", token.id, max_age=settings.auth.get("session_ttl", 24*60*60), domain=domain)
    return r

@api.get("/user", response_model=WocResponse[User])
async def get_user(token_obj: Token = Depends(validate_token)):
    user = await User.get(token_obj.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return WocResponse[User](data=user)

@api.get("/token", response_model=WocResponse[List[Token]])
async def get_user_tokens(token_obj: Token = Depends(validate_token), token_type: Literal["session", "api", None] = None):
    if token_obj.token_type != "session":
        raise HTTPException(status_code=400, detail="You can not manage API tokens with an API token")
    q = {
            "user_id": token_obj.user_id,
            "token_type": token_type,
            "revoked": False,
            "expires": {"$gt": int(time.time())}
        }
    if token_type:
        q["token_type"] = token_type
    
    tokens = await Token.find(q)
    return WocResponse[List[Token]](data=tokens)

@api.post("/token", response_model=WocResponse[Token])
async def create_token(token_obj: Token = Depends(validate_token), client_info = Depends(get_client_info)):
    if token_obj.token_type != "session":
        raise HTTPException(status_code=400, detail="You can not manage API tokens with an API token")
    token = await _create_token(token_obj.user_id, client_info, "api")
    return WocResponse[Token](data=token)

@api.delete("/token/{token_id}", response_model=WocResponse[Token])
async def revoke_token(token_id: Optional[str] = None, token_obj: Token = Depends(validate_token)):
    if token_id is None:  # effectively logging out
        token_id = token_obj.id
    if token_obj.token_type != "session":
        raise HTTPException(status_code=400, detail="You can not manage API tokens with an API token")
    user_id = token_obj.user_id
    # set revoked to True
    token = await Token.get(token_id)
    if token is None:
        raise HTTPException(status_code=404, detail="Token not found")
    if token.user_id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    token.revoked = True
    await token.save()
    r = JSONResponse(WocResponse[Token](data=token))
    # tell the client to delete the cookie if token_obj.id == token_id
    if token_obj.id == token_id:
        r.delete_cookie("token")
    return r

@api.get("/email/login", dependencies=[Depends(validate_turnstile)])
async def email_login(email: str, client_info = Depends(get_client_info), base_url: str = Depends(get_base_url)):
    # check if a valid one_time_code exists
    one_time_code = await OneTimeCode.find_one({"provider_id": f"email|{email}", "expires": {"$gt": int(time.time())}, "revoked": False})
    if one_time_code is not None:
        # means a request is pending
        return HTTPException(status_code=400, detail="A request is pending. Please check your email.")
    
    # creates a one_time_code
    one_time_code = await _create_one_time_code(f"email|{email}", client_info)
    # is it a sign up request?
    user = await User.find_one({"provider_id": f"email|{email}"})
    is_signup = user is None
    # send email
    assert settings.smtp.title_template is not None, "title_template is not set"
    assert settings.smtp.content_template is not None, "content_template is not set"
    title = jinja2.Template(settings.smtp.title_template).render(email=email)
    content = jinja2.Template(settings.smtp.content_template).render(
            is_signup=is_signup,
            magic_link=f"{base_url}/auth/email/callback?state={one_time_code.id}",
            expire_mins=int(settings.auth.get("code_ttl", 10*60)) // 60
        )
    try:
        await send_email(email, title, html=content)
        return WocResponse[Optional[str]](data=f"Email sent to {email}")
    except Exception as e:
        logger.exception(f"Failed to send email to {email}: {e}")
        # clean up one time code
        await one_time_code.delete()
        return WocResponse[Optional[str]](data=None, errors={"email": f"Failed to send email to {email}"})
    
@api.get("/email/callback")
async def email_callback(one_time_code: OneTimeCode = Depends(validate_one_time_code), client_info = Depends(get_client_info), base_url: str = Depends(get_base_url)):
    # sign up
    name = one_time_code.provider_id.split("|")[1]
    # it should be a email
    if "@" in name:
        name = name.split("@")[0]
    return await _generate_login_response(one_time_code.provider_id, client_info, name, base_url)

@api.get("/github/login", dependencies=[Depends(validate_turnstile)])
async def github_login(base_url: str = Depends(get_base_url), client_info = Depends(get_client_info)):
    redirect_url = f"{base_url}/auth/github/callback"
    if not (settings.github.app_id and settings.github.app_secret):
        raise ValueError("github.app_id or github.app_secret is not set")

    # creates a one_time_code
    one_time_code = await _create_one_time_code("github|", client_info)
    _params = {
        "client_id": settings.github.app_id,
        "redirect_uri": redirect_url,
        "state": one_time_code.id,
        "scope": "user:email"
    }
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{urlencode(_params)}")

@api.get("/github/callback", dependencies=[Depends(validate_one_time_code)])
async def github_callback(request: Request, code: Optional[str], error: Optional[str] = None, base_url: str = Depends(get_base_url), client_info = Depends(get_client_info)):
    if error is not None:
        raise HTTPException(status_code=400, detail=f"Github login failed: {error}")
    # get github user info
    redirect_url = f"{base_url}/auth/github/callback"
    
    try:
        async with get_httpx_client(request) as client:
            r = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.github.app_id,
                    "client_secret": settings.github.app_secret,
                    "code": code,
                    "redirect_uri": redirect_url
                },
                headers={"Accept": "application/json"}
            )
            r.raise_for_status()
            access_token = r.json().get("access_token")
            if access_token is None:
                raise HTTPException(status_code=400, detail="Failed to get access token")
            # get user info (name and id)
            r = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"token {access_token}", "Accept": "application/vnd.github.v3+json"}
            )
            r.raise_for_status()
            _user_info = r.json()
            _user_id = _user_info.get("id")
            _name = _user_info.get("name") or _user_info.get("login") or _user_info.get("id")
            if _user_id is None:
                raise HTTPException(status_code=400, detail="Failed to get user info")
    except Exception as e:
        logger.exception(f"Failed to get github user info: {e}")
        raise HTTPException(status_code=400, detail="Failed to get github user info")
    
    return await _generate_login_response(f"github|{_user_id}", client_info, _name, base_url)
        

@api.get("/microsoft/login", dependencies=[Depends(validate_turnstile)])
async def microsoft_login(base_url: str = Depends(get_base_url), client_info = Depends(get_client_info)):
    one_time_code = await _create_one_time_code("microsoft|", client_info)
    redirect_url = f"{base_url}/auth/microsoft/callback"
    _params = {
                "client_id": settings.microsoft.app_id,
                "redirect_uri": redirect_url,
                "response_mode": "form_post",
                "response_type": "id_token token",
                "scope": "openid User.Read",
                "nonce": one_time_code.id,
                "state": one_time_code.id,
            }
    return RedirectResponse(f"https://login.microsoftonline.com/{settings.microsoft.tenant_id}/oauth2/v2.0/authorize?{urlencode(_params)}")
    

@api.get("/microsoft/callback", dependencies=[Depends(validate_one_time_code)])
@api.post("/microsoft/callback", dependencies=[Depends(validate_one_time_code)])
async def microsoft_callback(
    request: Request, 
    access_token: str = Form(...),
    error_description: Optional[str] = None,
    base_url: str = Depends(get_base_url), 
    client_info = Depends(get_client_info)
):
    if error_description is not None:
        raise HTTPException(status_code=400, detail=f"Microsoft login failed: {error_description}")
    
    # redirect_url = f"{base_url}/auth/microsoft/callback"
    try:
        async with get_httpx_client(request) as client:
            # r = await client.post(
            #     f"https://login.microsoftonline.com/{settings.microsoft.tenant_id}/oauth2/v2.0/token",
            #     data={
            #         "tenant": settings.microsoft.tenant_id,
            #         "client_id": settings.microsoft.app_id,
            #         "client_secret": settings.microsoft.app_secret,
            #         "scope": "User.Read",
            #         "grant_type": "client_credentials",
            #     },
            #     headers={"Accept": "application/json"}
            # )
            # r.raise_for_status()
            # access_token = r.json().get("access_token")
            # if access_token is None:
            #     raise HTTPException(status_code=400, detail="Failed to get access token")
            # # get user info (name and id)
            r = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            r.raise_for_status()
            _user_info = r.json()
            _user_id = _user_info.get("id")
            _name = _user_info.get("displayName") or _user_info.get("userPrincipalName") or _user_info.get("givenName") or _user_info.get("id")
            if _user_id is None:
                raise HTTPException(status_code=400, detail="Failed to get user info")
    except Exception as e:
        logger.exception(f"Failed to get microsoft user info: {e}")
        raise HTTPException(status_code=400, detail="Failed to get microsoft user info")
    
    return await _generate_login_response(f"microsoft|{_user_id}", client_info, _name, base_url)