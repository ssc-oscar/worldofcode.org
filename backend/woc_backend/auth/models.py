from pydantic import BaseModel, Field
from beanie import Document, Indexed
from typing import Dict, Optional


class Token(Document, BaseModel):
    # create an hash indexed field for the id
    id: str = Indexed(index_type="hashed", unique=True)
    """token id like woc-{user.id}-{token.id}"""
    user_id: str = Indexed()
    """user who owns the token"""
    expires: int = Indexed()
    """token expiration timestamp"""
    revoked: bool = Field(False)
    """token is revoked"""
    request_ip: Optional[str] = Field(None)
    """request_ip is the IP address of the request"""
    user_agent: Optional[str] = Field(None)
    """user_agent is the User-Agent header of the request"""
    token_type: Optional[str] = Field(None)
    """token type, like session, api, etc."""
    name: Optional[str] = Field(None)
    """token name, like 'default', 'admin', etc."""


class OneTimeCode(Document, BaseModel):
    """OneTimeCode is a token that can be used only once. It can not access APIs.
    Here id is the code itself (22-char short uuid), user_id is the provider_id.
    """

    # create an hash indexed field for the id
    id: str = Indexed(index_type="hashed", unique=True)
    """token id like woc-{user.id}-{token.id}"""
    expires: int = Indexed()
    """token expiration timestamp"""
    revoked: bool = Field(False)
    """token is revoked"""
    request_ip: Optional[str] = Field(None)
    """request_ip is the IP address of the request"""
    user_agent: Optional[str] = Field(None)
    """user_agent is the User-Agent header of the request"""
    provider_id: str = Indexed()
    """provider_id is like email|hrz6976@hotmail.com, phone|1234567890, github|12345678. It must be unique"""
    referrer: Optional[str] = Field(None)
    """referrer is the URL that the user came from"""


class User(Document, BaseModel):
    id: str = Indexed(index_type="hashed", unique=True)
    """id is a short uuid like edF8BXKwqjzLdT4ECVRoMe"""
    name: str = Field(..., description="User name")
    """name is the user's full name. user can change it"""
    provider_id: str = Field(unique=True, description="Provider user id")
    """provider_id is like email|hrz6976@hotmail.com, phone|1234567890, github|12345678. It must be unique"""
