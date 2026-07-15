"""Permission module models and DAOs"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import Column, DateTime, Index, Integer, PrimaryKeyConstraint, String

from dbgpt.storage.metadata import BaseDao, Model

from ..api.schemas import (
    DeptRequest,
    DeptResponse,
    RoleRequest,
    RoleResponse,
    UserCreateRequest,
    UserResponse,
)


class SysUserEntity(Model):
    """System user entity"""

    __tablename__ = "sys_user"
    __table_args__ = (Index("idx_sys_user_deleted_id", "deleted", "id"),)

    id = Column(Integer, primary_key=True, autoincrement=True, comment="Auto increment id")
    username = Column(String(64), unique=True, index=True, nullable=False, comment="Username")
    password_hash = Column(String(256), nullable=False, comment="Password hash")
    email = Column(String(128), nullable=True, comment="Email")
    real_name = Column(String(64), nullable=True, comment="Real name")
    phone = Column(String(20), nullable=True, comment="Phone number")
    status = Column(Integer, default=1, comment="Status: 0=disabled, 1=enabled")
    deleted = Column(Integer, default=0, comment="Soft delete: 0=normal, 1=deleted")
    gmt_created = Column(DateTime, default=datetime.now, comment="Record creation time")
    gmt_modified = Column(DateTime, default=datetime.now, comment="Record update time")

    def __repr__(self):
        return (
            f"SysUserEntity(id={self.id}, username='{self.username}', "
            f"status={self.status}, deleted={self.deleted})"
        )


class SysRoleEntity(Model):
    """System role entity"""

    __tablename__ = "sys_role"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="Auto increment id")
    role_code = Column(String(64), unique=True, index=True, nullable=False, comment="Role code")
    role_name = Column(String(64), nullable=False, comment="Role name")
    description = Column(String(256), nullable=True, comment="Role description")
    status = Column(Integer, default=1, comment="Status: 0=disabled, 1=enabled")
    gmt_created = Column(DateTime, default=datetime.now, comment="Record creation time")
    gmt_modified = Column(DateTime, default=datetime.now, comment="Record update time")

    def __repr__(self):
        return (
            f"SysRoleEntity(id={self.id}, role_code='{self.role_code}', "
            f"role_name='{self.role_name}')"
        )


class SysDeptEntity(Model):
    """System department entity"""

    __tablename__ = "sys_dept"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="Auto increment id")
    dept_name = Column(String(128), nullable=False, comment="Department name")
    dept_code = Column(String(64), unique=True, index=True, nullable=False, comment="Department code")
    parent_id = Column(Integer, default=0, comment="Parent department id")
    order_num = Column(Integer, default=0, comment="Display order")
    status = Column(Integer, default=1, comment="Status: 0=disabled, 1=enabled")
    gmt_created = Column(DateTime, default=datetime.now, comment="Record creation time")
    gmt_modified = Column(DateTime, default=datetime.now, comment="Record update time")

    def __repr__(self):
        return (
            f"SysDeptEntity(id={self.id}, dept_code='{self.dept_code}', "
            f"dept_name='{self.dept_name}')"
        )


class SysUserRoleEntity(Model):
    """User-Role relationship entity"""

    __tablename__ = "sys_user_role"
    __table_args__ = (
        PrimaryKeyConstraint("user_id", "role_id"),
    )

    user_id = Column(Integer, nullable=False, comment="User id")
    role_id = Column(Integer, nullable=False, comment="Role id")

    def __repr__(self):
        return f"SysUserRoleEntity(user_id={self.user_id}, role_id={self.role_id})"


class SysUserDeptEntity(Model):
    """User-Department relationship entity"""

    __tablename__ = "sys_user_dept"
    __table_args__ = (
        PrimaryKeyConstraint("user_id", "dept_id"),
    )

    user_id = Column(Integer, nullable=False, comment="User id")
    dept_id = Column(Integer, nullable=False, comment="Department id")

    def __repr__(self):
        return f"SysUserDeptEntity(user_id={self.user_id}, dept_id={self.dept_id})"


class SysUserDao(BaseDao[SysUserEntity, UserCreateRequest, UserResponse]):
    """DAO for system users"""

    def from_request(self, request: Union[UserCreateRequest, Dict[str, Any]]) -> SysUserEntity:
        """Convert the request to an entity"""
        request_dict = request.dict() if hasattr(request, "dict") else request
        # Remove fields not in entity
        request_dict.pop("role_ids", None)
        request_dict.pop("dept_ids", None)
        request_dict.pop("password", None)
        entity = SysUserEntity(**request_dict)
        return entity

    def to_response(self, entity: SysUserEntity) -> UserResponse:
        """Convert the entity to a response"""
        gmt_created_str = (
            entity.gmt_created.strftime("%Y-%m-%d %H:%M:%S")
            if entity.gmt_created
            else None
        )
        return UserResponse(
            id=entity.id,
            username=entity.username,
            email=entity.email,
            real_name=entity.real_name,
            phone=entity.phone,
            status=entity.status,
            gmt_created=gmt_created_str,
        )


class SysRoleDao(BaseDao[SysRoleEntity, RoleRequest, RoleResponse]):
    """DAO for system roles"""

    def from_request(self, request: Union[RoleRequest, Dict[str, Any]]) -> SysRoleEntity:
        """Convert the request to an entity"""
        request_dict = request.dict() if hasattr(request, "dict") else request
        entity = SysRoleEntity(**request_dict)
        return entity

    def to_response(self, entity: SysRoleEntity) -> RoleResponse:
        """Convert the entity to a response"""
        return RoleResponse(
            id=entity.id,
            role_code=entity.role_code,
            role_name=entity.role_name,
            description=entity.description,
            status=entity.status,
        )


class SysDeptDao(BaseDao[SysDeptEntity, DeptRequest, DeptResponse]):
    """DAO for system departments"""

    def from_request(self, request: Union[DeptRequest, Dict[str, Any]]) -> SysDeptEntity:
        """Convert the request to an entity"""
        request_dict = request.dict() if hasattr(request, "dict") else request
        entity = SysDeptEntity(**request_dict)
        return entity

    def to_response(self, entity: SysDeptEntity) -> DeptResponse:
        """Convert the entity to a response"""
        return DeptResponse(
            id=entity.id,
            dept_name=entity.dept_name,
            dept_code=entity.dept_code,
            parent_id=entity.parent_id,
            status=entity.status,
        )
