"""Permission API endpoints"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException

from dbgpt.component import SystemApp
from dbgpt_serve.core import Result

from ..config import ServeConfig
from ..service.service import PermissionService
from .dependencies import (
    Principal,
    require_permission_manage,
    require_principal,
)
from .schemas import (
    DeptRequest,
    DeptResponse,
    LoginRequest,
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
        raise HTTPException(
            status_code=500, detail="Permission service not initialized"
        )
    return _permission_service


def get_current_principal(
    authorization: Optional[str] = Header(None),
) -> Principal:
    """Resolve the current authenticated Permission principal."""
    return require_principal(get_service(), authorization)


def get_permission_manager(
    principal: Principal = Depends(get_current_principal),
) -> Principal:
    """Require administrator or permission.manage for mutating routes."""
    return require_permission_manage(principal)


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
    principal: Principal = Depends(get_current_principal),
):
    """Get current user info from token"""
    service = get_service()
    user = service.get_user(principal.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return Result.succ(user)


# ==================== User Endpoints ====================


@router.get("/users")
async def list_users(
    page: int = 1,
    page_size: int = 20,
    principal: Principal = Depends(get_current_principal),
):
    """List users with pagination"""
    service = get_service()
    return Result.succ(service.list_users(page=page, page_size=page_size))


@router.post("/users", response_model=Result[UserResponse])
async def create_user(
    request: UserCreateRequest,
    principal: Principal = Depends(get_permission_manager),
):
    """Create a new user"""
    service = get_service()
    return Result.succ(service.create_user(request))


@router.get("/users/{user_id}", response_model=Result[UserResponse])
async def get_user(
    user_id: int,
    principal: Principal = Depends(get_current_principal),
):
    """Get user by ID"""
    service = get_service()
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return Result.succ(user)


@router.put("/users/{user_id}", response_model=Result[UserResponse])
async def update_user(
    user_id: int,
    request: UserUpdateRequest,
    principal: Principal = Depends(get_permission_manager),
):
    """Update user information"""
    service = get_service()
    user = service.update_user(user_id, request)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return Result.succ(user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    principal: Principal = Depends(get_permission_manager),
):
    """Delete a user (soft delete)"""
    service = get_service()
    success = service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return Result.succ({"message": "User deleted successfully"})


# ==================== Role Endpoints ====================


@router.get("/roles", response_model=Result[List[RoleResponse]])
async def list_roles(principal: Principal = Depends(get_current_principal)):
    """List all roles"""
    service = get_service()
    return Result.succ(service.list_roles())


@router.post("/roles", response_model=Result[RoleResponse])
async def create_role(
    request: RoleRequest,
    principal: Principal = Depends(get_permission_manager),
):
    """Create a new role"""
    service = get_service()
    return Result.succ(service.create_role(request))


@router.put("/roles/{role_id}", response_model=Result[RoleResponse])
async def update_role(
    role_id: int,
    request: RoleRequest,
    principal: Principal = Depends(get_permission_manager),
):
    """Update a role"""
    service = get_service()
    role = service.update_role(role_id, request)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return Result.succ(role)


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    principal: Principal = Depends(get_permission_manager),
):
    """Delete a role"""
    service = get_service()
    success = service.delete_role(role_id)
    if not success:
        raise HTTPException(status_code=404, detail="Role not found")
    return Result.succ({"message": "Role deleted successfully"})


# ==================== Department Endpoints ====================


@router.get("/depts", response_model=Result[List[DeptResponse]])
async def list_depts(principal: Principal = Depends(get_current_principal)):
    """List all departments (tree structure)"""
    service = get_service()
    return Result.succ(service.list_depts())


@router.post("/depts", response_model=Result[DeptResponse])
async def create_dept(
    request: DeptRequest,
    principal: Principal = Depends(get_permission_manager),
):
    """Create a new department"""
    service = get_service()
    return Result.succ(service.create_dept(request))


@router.put("/depts/{dept_id}", response_model=Result[DeptResponse])
async def update_dept(
    dept_id: int,
    request: DeptRequest,
    principal: Principal = Depends(get_permission_manager),
):
    """Update a department"""
    service = get_service()
    dept = service.update_dept(dept_id, request)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return Result.succ(dept)


@router.delete("/depts/{dept_id}")
async def delete_dept(
    dept_id: int,
    principal: Principal = Depends(get_permission_manager),
):
    """Delete a department"""
    service = get_service()
    success = service.delete_dept(dept_id)
    if not success:
        raise HTTPException(status_code=404, detail="Department not found")
    return Result.succ({"message": "Department deleted successfully"})
