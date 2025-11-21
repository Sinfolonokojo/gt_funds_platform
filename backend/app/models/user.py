# backend/app/models/user.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Base user fields."""
    email: EmailStr
    name: str = Field(min_length=2, max_length=100)
    role: str = Field(default="user", pattern="^(user|admin)$")

class UserCreate(UserBase):
    """Fields required to create a user."""
    password: str = Field(min_length=8, max_length=100)

class UserLogin(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: str

class UserInDB(UserBase):
    """User stored in database."""
    id: str = Field(alias="_id")
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class UserResponse(UserBase):
    """User response without sensitive data."""
    id: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Data encoded in JWT token."""
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
