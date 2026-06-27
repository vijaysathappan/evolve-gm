"""
User Domain Router.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Any
from .schemas import UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=dict)
async def signup(user_in: UserCreate) -> Any:
    # Dummy implementation to unblock the frontend immediately
    # We will hook this up to the repository in the next commit
    return {
        "user": {
            "id": user_in.userId,
            "email": user_in.email,
            "role": "student"
        }
    }

@router.post("/signin", response_model=dict)
async def signin(user_in: UserLogin) -> Any:
    # Dummy implementation to unblock the frontend immediately
    if user_in.userId == "vijay_sathappan" and user_in.password == "Friends*115":
        return {
            "user": {
                "id": user_in.userId,
                "email": "vijay@gmail.com",
                "role": "student"
            }
        }
    
    # Generic success for any other input for dev testing
    return {
        "user": {
            "id": user_in.userId,
            "email": "test@gmail.com",
            "role": "student"
        }
    }
