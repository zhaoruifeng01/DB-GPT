"""Permission API endpoints"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Header, HTTPException

from dbgpt.component import SystemApp
from dbgpt_serve.core import Result

from ..config import ServeConfig
from ..service.service import PermissionService
from .schemas import (
    DeptRequest,
    DeptResponse,
    LoginRequest,
    LoginResponse,
    RoleRequest,
    RoleResponse,
    UserCreateRequest,
    UserResponse,
    UserUpdateRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Global service instance
_permission_service: Optional[PermissionService] = None


def get_service() -> PermissionService:
    """Get the permission service instance"""
    if _permission_service is None:
        raise HTTPException(status_code=500, detail="Permission service not initialized")
    return _permission_service


def init_endpoints(system_app: SystemApp, config: ServeConfig) -> None:
    """Initialize the permission endpoints"""
    global _permission_service
    # Service will be set by Serve.before_start()
    logger.info("Permission endpoints initialized")


def set_service(service: PermissionService) -> None:
    """Set the permission service instance (called by Serve)"""
    global _permission_service
    _permission_service = service


# ==================== Auth Endpoints ====================


@router.post("/auth/login")
async def login(request: LoginRequest):
    """User login endpoint"""
    service = get_service()
    result = service.authenticate(request.username, request.password)
    if not result:
        return Result.failed(msg="Invalid username or password", err_code="AUTH_FAILED")
    return Result.succ(result)


@router.get("/auth/info", response_model=Result[UserResponse])
async def get_current_user_info(
    authorization: Optional[str] = Header(None),
):
    """Get current user info from token"""
    service = get_service()
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # Extract token from "Bearer <token>"
    token = authorization
    if authorization.startswith("Bearer "):
        token = authorization[7:]

    payload = service.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = service.get_user(payload["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return Result.succ(user)


# ==================== User Endpoints ====================


@router.get("/users")
async def list_users(page: int = 1, page_size: int = 20):
    """List users with pagination"""
    service = get_service()
    return Result.succ(service.list_users(page=page, page_size=page_size))


@router.post("/users", response_model=Result[UserResponse])
async def create_user(request: UserCreateRequest):
    """Create a new user"""
    service = get_service()
    return Result.succ(service.create_user(request))


@router.get("/users/{user_id}", response_model=Result[UserResponse])
async def get_user(user_id: int):
    """Get user by ID"""
    service = get_service()
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return Result.succ(user)


@router.put("/users/{user_id}", response_model=Result[UserResponse])
async def update_user(user_id: int, request: UserUpdateRequest):
    """Update user information"""
    service = get_service()
    user = service.update_user(user_id, request)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return Result.succ(user)


@router.delete("/users/{user_id}")
async def delete_user(user_id: int):
    """Delete a user (soft delete)"""
    service = get_service()
    success = service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return Result.succ({"message": "User deleted successfully"})


# ==================== Role Endpoints ====================


@router.get("/roles", response_model=Result[List[RoleResponse]])
async def list_roles():
    """List all roles"""
    service = get_service()
    return Result.succ(service.list_roles())


@router.post("/roles", response_model=Result[RoleResponse])
async def create_role(request: RoleRequest):
    """Create a new role"""
    service = get_service()
    return Result.succ(service.create_role(request))


@router.put("/roles/{role_id}", response_model=Result[RoleResponse])
async def update_role(role_id: int, request: RoleRequest):
    """Update a role"""
    service = get_service()
    role = service.update_role(role_id, request)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return Result.succ(role)


@router.delete("/roles/{role_id}")
async def delete_role(role_id: int):
    """Delete a role"""
    service = get_service()
    success = service.delete_role(role_id)
    if not success:
        raise HTTPException(status_code=404, detail="Role not found")
    return Result.succ({"message": "Role deleted successfully"})


# ==================== Department Endpoints ====================


@router.get("/depts", response_model=Result[List[DeptResponse]])
async def list_depts():
    """List all departments (tree structure)"""
    service = get_service()
    return Result.succ(service.list_depts())


@router.post("/depts", response_model=Result[DeptResponse])
async def create_dept(request: DeptRequest):
    """Create a new department"""
    service = get_service()
    return Result.succ(service.create_dept(request))


@router.put("/depts/{dept_id}", response_model=Result[DeptResponse])
async def update_dept(dept_id: int, request: DeptRequest):
    """Update a department"""
    service = get_service()
    dept = service.update_dept(dept_id, request)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return Result.succ(dept)


@router.delete("/depts/{dept_id}")
async def delete_dept(dept_id: int):
    """Delete a department"""
    service = get_service()
    success = service.delete_dept(dept_id)
    if not success:
        raise HTTPException(status_code=404, detail="Department not found")
    return Result.succ({"message": "Department deleted successfully"})
