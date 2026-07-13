from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import UserRole

class UserBase(BaseModel):
    display_name: str
    email: EmailStr
    role: UserRole = UserRole.AM
    teams_user_id: str | None = None
    position: str | None = None
    unit: str | None = None
    department: str | None = None
    region: str | None = None
    phone: str | None = None
    notes: str | None = None
    is_active: bool = True

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    display_name: str | None = None
    role: UserRole | None = None
    teams_user_id: str | None = None
    position: str | None = None
    unit: str | None = None
    department: str | None = None
    region: str | None = None
    phone: str | None = None
    notes: str | None = None
    is_active: bool | None = None

class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: EmailStr
    password: str