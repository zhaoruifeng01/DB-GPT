"""Permission module Pydantic schemas"""

from typing import List, Optional

from dbgpt._private.pydantic import BaseModel, ConfigDict, Field

from ..config import SERVE_APP_NAME_HUMP


class LoginRequest(BaseModel):
    """Login request model"""

    model_config = ConfigDict(title=f"LoginRequest for {SERVE_APP_NAME_HUMP}")

    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")


class LoginResponse(BaseModel):
    """Login response model"""

    model_config = ConfigDict(title=f"LoginResponse for {SERVE_APP_NAME_HUMP}")

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user_id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    role_codes: List[str] = Field(default=[], description="User role codes")
    dept_names: List[str] = Field(default=[], description="User department names")


class UserCreateRequest(BaseModel):
    """User create request model"""

    model_config = ConfigDict(title=f"UserCreateRequest for {SERVE_APP_NAME_HUMP}")

    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")
    email: Optional[str] = Field(default=None, description="Email")
    real_name: Optional[str] = Field(default=None, description="Real name")
    phone: Optional[str] = Field(default=None, description="Phone number")
    role_ids: List[int] = Field(default=[], description="Role IDs to assign")
    dept_ids: List[int] = Field(default=[], description="Department IDs to assign")


class UserUpdateRequest(BaseModel):
    """User update request model"""

    model_config = ConfigDict(title=f"UserUpdateRequest for {SERVE_APP_NAME_HUMP}")

    email: Optional[str] = Field(default=None, description="Email")
    real_name: Optional[str] = Field(default=None, description="Real name")
    phone: Optional[str] = Field(default=None, description="Phone number")
    status: Optional[int] = Field(default=None, description="Status: 0=disabled, 1=enabled")
    role_ids: Optional[List[int]] = Field(default=None, description="Role IDs to assign")
    dept_ids: Optional[List[int]] = Field(default=None, description="Department IDs to assign")


class RoleResponse(BaseModel):
    """Role response model"""

    model_config = ConfigDict(title=f"RoleResponse for {SERVE_APP_NAME_HUMP}")

    id: int = Field(..., description="Role ID")
    role_code: str = Field(..., description="Role code")
    role_name: str = Field(..., description="Role name")
    description: Optional[str] = Field(default=None, description="Role description")
    status: int = Field(default=1, description="Status")


class DeptResponse(BaseModel):
    """Department response model"""

    model_config = ConfigDict(title=f"DeptResponse for {SERVE_APP_NAME_HUMP}")

    id: int = Field(..., description="Department ID")
    dept_name: str = Field(..., description="Department name")
    dept_code: str = Field(..., description="Department code")
    parent_id: int = Field(default=0, description="Parent department ID")
    status: int = Field(default=1, description="Status")
    children: List["DeptResponse"] = Field(default=[], description="Child departments")


class UserResponse(BaseModel):
    """User response model"""

    model_config = ConfigDict(title=f"UserResponse for {SERVE_APP_NAME_HUMP}")

    id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: Optional[str] = Field(default=None, description="Email")
    real_name: Optional[str] = Field(default=None, description="Real name")
    phone: Optional[str] = Field(default=None, description="Phone number")
    status: int = Field(default=1, description="Status")
    roles: List[RoleResponse] = Field(default=[], description="User roles")
    departments: List[DeptResponse] = Field(default=[], description="User departments")
    gmt_created: Optional[str] = Field(default=None, description="Creation time")


class RoleRequest(BaseModel):
    """Role create/update request model"""

    model_config = ConfigDict(title=f"RoleRequest for {SERVE_APP_NAME_HUMP}")

    role_code: str = Field(..., description="Role code")
    role_name: str = Field(..., description="Role name")
    description: Optional[str] = Field(default=None, description="Role description")


class DeptRequest(BaseModel):
    """Department create/update request model"""

    model_config = ConfigDict(title=f"DeptRequest for {SERVE_APP_NAME_HUMP}")

    dept_name: str = Field(..., description="Department name")
    dept_code: str = Field(..., description="Department code")
    parent_id: int = Field(default=0, description="Parent department ID")
    order_num: int = Field(default=0, description="Display order")
