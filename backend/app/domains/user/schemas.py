"""
User Domain Schemas.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    userId: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    userId: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: str

    model_config = {"from_attributes": True}
