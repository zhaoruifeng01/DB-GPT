"""Permission service - business logic layer"""

import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime
from typing import Dict, List, Optional

from dbgpt.storage.metadata import DatabaseManager

from ..api.schemas import (
    DeptRequest,
    DeptResponse,
    LoginResponse,
    RoleRequest,
    RoleResponse,
    UserCreateRequest,
    UserResponse,
    UserUpdateRequest,
)
from ..config import ServeConfig
from ..models.models import (
    SysDeptEntity,
    SysRoleEntity,
    SysUserDeptEntity,
    SysUserEntity,
    SysUserRoleEntity,
)

logger = logging.getLogger(__name__)

# Password hashing utilities - prefer passlib if available, fallback to hashlib
try:
    from passlib.context import CryptContext

    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def _hash_password(password: str) -> str:
        return _pwd_context.hash(password)

    def _verify_password(password: str, password_hash: str) -> bool:
        return _pwd_context.verify(password, password_hash)

except ImportError:

    def _hash_password(password: str) -> str:
        salt = os.urandom(32).hex()
        hash_value = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), salt.encode(), 100000
        ).hex()
        return f"{salt}${hash_value}"

    def _verify_password(password: str, stored: str) -> bool:
        try:
            salt, hash_value = stored.split("$")
            computed = hashlib.pbkdf2_hmac(
                "sha256", password.encode(), salt.encode(), 100000
            ).hex()
            return hmac.compare_digest(hash_value, computed)
        except (ValueError, AttributeError):
            return False


# JWT utilities - prefer PyJWT if available, fallback to hmac-based token
try:
    import jwt as pyjwt

    def _create_jwt_token(
        user_id: int, username: str, secret_key: str, expire_seconds: int
    ) -> str:
        payload = {
            "user_id": user_id,
            "username": username,
            "exp": int(time.time()) + expire_seconds,
            "iat": int(time.time()),
        }
        return pyjwt.encode(payload, secret_key, algorithm="HS256")

    def _verify_jwt_token(token: str, secret_key: str) -> Optional[dict]:
        try:
            payload = pyjwt.decode(token, secret_key, algorithms=["HS256"])
            return payload
        except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError):
            return None

except ImportError:
    import base64

    def _create_jwt_token(
        user_id: int, username: str, secret_key: str, expire_seconds: int
    ) -> str:
        payload = {
            "user_id": user_id,
            "username": username,
            "exp": int(time.time()) + expire_seconds,
            "iat": int(time.time()),
        }
        payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
        payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode().rstrip("=")
        signature = hmac.new(
            secret_key.encode(), payload_b64.encode(), hashlib.sha256
        ).hexdigest()
        return f"{payload_b64}.{signature}"

    def _verify_jwt_token(token: str, secret_key: str) -> Optional[dict]:
        try:
            parts = token.split(".")
            if len(parts) != 2:
                return None
            payload_b64, signature = parts
            expected_sig = hmac.new(
                secret_key.encode(), payload_b64.encode(), hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(signature, expected_sig):
                return None
            # Restore padding
            padding = 4 - len(payload_b64) % 4
            if padding != 4:
                payload_b64 += "=" * padding
            payload_bytes = base64.urlsafe_b64decode(payload_b64)
            payload = json.loads(payload_bytes)
            if payload.get("exp", 0) < int(time.time()):
                return None
            return payload
        except Exception:
            return None


class PermissionService:
    """Permission service handles user, role, and department management"""

    def __init__(self, db_manager: DatabaseManager, config: ServeConfig):
        self._db_manager = db_manager
        self._config = config

    def hash_password(self, password: str) -> str:
        """Hash a password"""
        return _hash_password(password)

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against its hash"""
        return _verify_password(password, password_hash)

    def create_token(self, user_id: int, username: str) -> str:
        """Create a JWT token"""
        return _create_jwt_token(
            user_id,
            username,
            self._config.jwt_secret_key,
            self._config.jwt_expire_seconds,
        )

    def verify_token(self, token: str) -> Optional[dict]:
        """Verify a JWT token and return payload"""
        return _verify_jwt_token(token, self._config.jwt_secret_key)

    @staticmethod
    def verify_token_static(token: str) -> Optional[dict]:
        """Verify JWT token without needing service instance (for auth.py integration)"""
        secret_key = os.environ.get("DBGPT_JWT_SECRET_KEY", "dbgpt-secret-key-for-hs256-signing!")
        try:
            import jwt

            payload = jwt.decode(token, secret_key, algorithms=["HS256"])
            return payload
        except ImportError:
            import base64

            try:
                parts = token.split(".")
                if len(parts) != 3:
                    return None
                payload_b64 = parts[1] + "=" * (4 - len(parts[1]) % 4)
                payload = json.loads(base64.urlsafe_b64decode(payload_b64))
                return payload
            except Exception:
                return None
        except Exception:
            return None

    # ==================== User Management ====================

    def authenticate(self, username: str, password: str) -> Optional[LoginResponse]:
        """Authenticate user and return login response with token"""
        with self._db_manager.session() as session:
            user = (
                session.query(SysUserEntity)
                .filter(
                    SysUserEntity.username == username,
                    SysUserEntity.deleted == 0,
                    SysUserEntity.status == 1,
                )
                .first()
            )
            if not user or not self.verify_password(password, user.password_hash):
                return None

            # Get user roles
            role_codes = []
            user_roles = (
                session.query(SysUserRoleEntity)
                .filter(SysUserRoleEntity.user_id == user.id)
                .all()
            )
            if user_roles:
                role_ids = [ur.role_id for ur in user_roles]
                roles = (
                    session.query(SysRoleEntity)
                    .filter(SysRoleEntity.id.in_(role_ids))
                    .all()
                )
                role_codes = [r.role_code for r in roles]

            # Get user departments
            dept_names = []
            user_depts = (
                session.query(SysUserDeptEntity)
                .filter(SysUserDeptEntity.user_id == user.id)
                .all()
            )
            if user_depts:
                dept_ids = [ud.dept_id for ud in user_depts]
                depts = (
                    session.query(SysDeptEntity)
                    .filter(SysDeptEntity.id.in_(dept_ids))
                    .all()
                )
                dept_names = [d.dept_name for d in depts]

            token = self.create_token(user.id, user.username)
            return LoginResponse(
                access_token=token,
                token_type="bearer",
                user_id=user.id,
                username=user.username,
                role_codes=role_codes,
                dept_names=dept_names,
            )

    def create_user(self, request: UserCreateRequest) -> UserResponse:
        """Create a new user"""
        with self._db_manager.session() as session:
            user = SysUserEntity(
                username=request.username,
                password_hash=self.hash_password(request.password),
                email=request.email,
                real_name=request.real_name,
                phone=request.phone,
                status=1,
                deleted=0,
                gmt_created=datetime.now(),
                gmt_modified=datetime.now(),
            )
            session.add(user)
            session.flush()

            # Assign roles
            for role_id in request.role_ids:
                session.add(SysUserRoleEntity(user_id=user.id, role_id=role_id))

            # Assign departments
            for dept_id in request.dept_ids:
                session.add(SysUserDeptEntity(user_id=user.id, dept_id=dept_id))

            session.commit()
            return self._build_user_response(session, user)

    def get_user(self, user_id: int) -> Optional[UserResponse]:
        """Get user by ID"""
        with self._db_manager.session() as session:
            user = (
                session.query(SysUserEntity)
                .filter(SysUserEntity.id == user_id, SysUserEntity.deleted == 0)
                .first()
            )
            if not user:
                return None
            return self._build_user_response(session, user)

    def get_user_by_username(self, username: str) -> Optional[SysUserEntity]:
        """Get user entity by username"""
        with self._db_manager.session() as session:
            return (
                session.query(SysUserEntity)
                .filter(
                    SysUserEntity.username == username,
                    SysUserEntity.deleted == 0,
                )
                .first()
            )

    def list_users(self, page: int = 1, page_size: int = 20) -> Dict:
        """List users with pagination"""
        with self._db_manager.session() as session:
            query = session.query(SysUserEntity).filter(SysUserEntity.deleted == 0)
            total = query.count()
            users = (
                query.order_by(SysUserEntity.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
                .all()
            )
            items = self._build_user_responses(session, users)
            return {
                "items": items,
                "total": total,
                "page": page,
                "page_size": page_size,
            }

    def update_user(
        self, user_id: int, request: UserUpdateRequest
    ) -> Optional[UserResponse]:
        """Update user information"""
        with self._db_manager.session() as session:
            user = (
                session.query(SysUserEntity)
                .filter(SysUserEntity.id == user_id, SysUserEntity.deleted == 0)
                .first()
            )
            if not user:
                return None

            if request.email is not None:
                user.email = request.email
            if request.real_name is not None:
                user.real_name = request.real_name
            if request.phone is not None:
                user.phone = request.phone
            if request.status is not None:
                user.status = request.status
            user.gmt_modified = datetime.now()

            # Update roles if provided
            if request.role_ids is not None:
                session.query(SysUserRoleEntity).filter(
                    SysUserRoleEntity.user_id == user_id
                ).delete()
                for role_id in request.role_ids:
                    session.add(SysUserRoleEntity(user_id=user_id, role_id=role_id))

            # Update departments if provided
            if request.dept_ids is not None:
                session.query(SysUserDeptEntity).filter(
                    SysUserDeptEntity.user_id == user_id
                ).delete()
                for dept_id in request.dept_ids:
                    session.add(SysUserDeptEntity(user_id=user_id, dept_id=dept_id))

            session.commit()
            return self._build_user_response(session, user)

    def delete_user(self, user_id: int) -> bool:
        """Soft delete a user"""
        with self._db_manager.session() as session:
            user = (
                session.query(SysUserEntity)
                .filter(SysUserEntity.id == user_id, SysUserEntity.deleted == 0)
                .first()
            )
            if not user:
                return False
            user.deleted = 1
            user.gmt_modified = datetime.now()
            session.commit()
            return True

    # ==================== Role Management ====================

    def create_role(self, request: RoleRequest) -> RoleResponse:
        """Create a new role"""
        with self._db_manager.session() as session:
            role = SysRoleEntity(
                role_code=request.role_code,
                role_name=request.role_name,
                description=request.description,
                status=1,
                gmt_created=datetime.now(),
                gmt_modified=datetime.now(),
            )
            session.add(role)
            session.commit()
            return RoleResponse(
                id=role.id,
                role_code=role.role_code,
                role_name=role.role_name,
                description=role.description,
                status=role.status,
            )

    def list_roles(self) -> List[RoleResponse]:
        """List all roles"""
        with self._db_manager.session() as session:
            roles = (
                session.query(SysRoleEntity)
                .filter(SysRoleEntity.status == 1)
                .all()
            )
            return [
                RoleResponse(
                    id=r.id,
                    role_code=r.role_code,
                    role_name=r.role_name,
                    description=r.description,
                    status=r.status,
                )
                for r in roles
            ]

    def update_role(self, role_id: int, request: RoleRequest) -> Optional[RoleResponse]:
        """Update a role"""
        with self._db_manager.session() as session:
            role = session.query(SysRoleEntity).filter(SysRoleEntity.id == role_id).first()
            if not role:
                return None
            role.role_code = request.role_code
            role.role_name = request.role_name
            role.description = request.description
            role.gmt_modified = datetime.now()
            session.commit()
            return RoleResponse(
                id=role.id,
                role_code=role.role_code,
                role_name=role.role_name,
                description=role.description,
                status=role.status,
            )

    def delete_role(self, role_id: int) -> bool:
        """Delete a role (set status to 0)"""
        with self._db_manager.session() as session:
            role = session.query(SysRoleEntity).filter(SysRoleEntity.id == role_id).first()
            if not role:
                return False
            role.status = 0
            role.gmt_modified = datetime.now()
            session.commit()
            return True

    # ==================== Department Management ====================

    def create_dept(self, request: DeptRequest) -> DeptResponse:
        """Create a new department"""
        with self._db_manager.session() as session:
            dept = SysDeptEntity(
                dept_name=request.dept_name,
                dept_code=request.dept_code,
                parent_id=request.parent_id,
                order_num=request.order_num,
                status=1,
                gmt_created=datetime.now(),
                gmt_modified=datetime.now(),
            )
            session.add(dept)
            session.commit()
            return DeptResponse(
                id=dept.id,
                dept_name=dept.dept_name,
                dept_code=dept.dept_code,
                parent_id=dept.parent_id,
                status=dept.status,
            )

    def list_depts(self) -> List[DeptResponse]:
        """List all departments as a tree structure"""
        with self._db_manager.session() as session:
            depts = (
                session.query(SysDeptEntity)
                .filter(SysDeptEntity.status == 1)
                .order_by(SysDeptEntity.order_num)
                .all()
            )
            return self._build_dept_tree(depts)

    def update_dept(self, dept_id: int, request: DeptRequest) -> Optional[DeptResponse]:
        """Update a department"""
        with self._db_manager.session() as session:
            dept = session.query(SysDeptEntity).filter(SysDeptEntity.id == dept_id).first()
            if not dept:
                return None
            dept.dept_name = request.dept_name
            dept.dept_code = request.dept_code
            dept.parent_id = request.parent_id
            dept.order_num = request.order_num
            dept.gmt_modified = datetime.now()
            session.commit()
            return DeptResponse(
                id=dept.id,
                dept_name=dept.dept_name,
                dept_code=dept.dept_code,
                parent_id=dept.parent_id,
                status=dept.status,
            )

    def delete_dept(self, dept_id: int) -> bool:
        """Delete a department (set status to 0)"""
        with self._db_manager.session() as session:
            dept = session.query(SysDeptEntity).filter(SysDeptEntity.id == dept_id).first()
            if not dept:
                return False
            dept.status = 0
            dept.gmt_modified = datetime.now()
            session.commit()
            return True

    # ==================== Initialization ====================

    def init_default_data(self):
        """Initialize default roles, departments, and admin user"""
        try:
            with self._db_manager.session() as session:
                # Create default roles if none exist
                role_count = session.query(SysRoleEntity).count()
                if role_count == 0:
                    admin_role = SysRoleEntity(
                        role_code="admin",
                        role_name="Administrator",
                        description="System administrator with full access",
                        status=1,
                        gmt_created=datetime.now(),
                        gmt_modified=datetime.now(),
                    )
                    normal_role = SysRoleEntity(
                        role_code="normal",
                        role_name="Normal User",
                        description="Normal user with limited access",
                        status=1,
                        gmt_created=datetime.now(),
                        gmt_modified=datetime.now(),
                    )
                    session.add(admin_role)
                    session.add(normal_role)
                    session.flush()

                # Create default department if none exist
                dept_count = session.query(SysDeptEntity).count()
                if dept_count == 0:
                    default_dept = SysDeptEntity(
                        dept_name="Default",
                        dept_code="default",
                        parent_id=0,
                        order_num=0,
                        status=1,
                        gmt_created=datetime.now(),
                        gmt_modified=datetime.now(),
                    )
                    session.add(default_dept)
                    session.flush()

                # Create admin user if none exist
                user_count = session.query(SysUserEntity).count()
                if user_count == 0:
                    admin_user = SysUserEntity(
                        username="admin",
                        password_hash=self.hash_password("admin123"),
                        email="admin@dbgpt.com",
                        real_name="Administrator",
                        status=1,
                        deleted=0,
                        gmt_created=datetime.now(),
                        gmt_modified=datetime.now(),
                    )
                    session.add(admin_user)
                    session.flush()

                    # Assign admin role to admin user
                    admin_role = (
                        session.query(SysRoleEntity)
                        .filter(SysRoleEntity.role_code == "admin")
                        .first()
                    )
                    if admin_role:
                        session.add(
                            SysUserRoleEntity(
                                user_id=admin_user.id, role_id=admin_role.id
                            )
                        )

                    # Assign default dept to admin user
                    default_dept = (
                        session.query(SysDeptEntity)
                        .filter(SysDeptEntity.dept_code == "default")
                        .first()
                    )
                    if default_dept:
                        session.add(
                            SysUserDeptEntity(
                                user_id=admin_user.id, dept_id=default_dept.id
                            )
                        )

                else:
                    # Check if admin user has placeholder password and fix it
                    admin_user = (
                        session.query(SysUserEntity)
                        .filter(
                            SysUserEntity.username == "admin",
                            SysUserEntity.deleted == 0,
                        )
                        .first()
                    )
                    if admin_user and admin_user.password_hash == "PLACEHOLDER_WILL_BE_SET_BY_APP":
                        admin_user.password_hash = self.hash_password("admin123")
                        logger.info("Admin user placeholder password has been replaced")

                session.commit()
                logger.info("Permission default data initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize default data: {e}")

    # ==================== Private Helpers ====================

    def _build_user_responses(
        self, session, users: List[SysUserEntity]
    ) -> List[UserResponse]:
        """Build user responses with bulk-loaded roles and departments."""
        if not users:
            return []

        user_ids = [user.id for user in users]
        user_roles = (
            session.query(SysUserRoleEntity)
            .filter(SysUserRoleEntity.user_id.in_(user_ids))
            .all()
        )
        role_ids = {user_role.role_id for user_role in user_roles}
        roles_by_id = {}
        if role_ids:
            roles_by_id = {
                role.id: role
                for role in session.query(SysRoleEntity)
                .filter(SysRoleEntity.id.in_(role_ids))
                .all()
            }

        user_depts = (
            session.query(SysUserDeptEntity)
            .filter(SysUserDeptEntity.user_id.in_(user_ids))
            .all()
        )
        dept_ids = {user_dept.dept_id for user_dept in user_depts}
        depts_by_id = {}
        if dept_ids:
            depts_by_id = {
                dept.id: dept
                for dept in session.query(SysDeptEntity)
                .filter(SysDeptEntity.id.in_(dept_ids))
                .all()
            }

        roles_by_user: Dict[int, List[RoleResponse]] = {
            user_id: [] for user_id in user_ids
        }
        for user_role in user_roles:
            role = roles_by_id.get(user_role.role_id)
            if role:
                roles_by_user[user_role.user_id].append(self._to_role_response(role))

        depts_by_user: Dict[int, List[DeptResponse]] = {
            user_id: [] for user_id in user_ids
        }
        for user_dept in user_depts:
            dept = depts_by_id.get(user_dept.dept_id)
            if dept:
                depts_by_user[user_dept.user_id].append(self._to_dept_response(dept))

        return [
            self._build_user_response_from_relations(
                user, roles_by_user[user.id], depts_by_user[user.id]
            )
            for user in users
        ]

    def _build_user_response(self, session, user: SysUserEntity) -> UserResponse:
        """Build user response with roles and departments"""
        # Get roles
        roles = []
        user_roles = (
            session.query(SysUserRoleEntity)
            .filter(SysUserRoleEntity.user_id == user.id)
            .all()
        )
        if user_roles:
            role_ids = [ur.role_id for ur in user_roles]
            role_entities = (
                session.query(SysRoleEntity)
                .filter(SysRoleEntity.id.in_(role_ids))
                .all()
            )
            roles = [self._to_role_response(role) for role in role_entities]

        # Get departments
        departments = []
        user_depts = (
            session.query(SysUserDeptEntity)
            .filter(SysUserDeptEntity.user_id == user.id)
            .all()
        )
        if user_depts:
            dept_ids = [ud.dept_id for ud in user_depts]
            dept_entities = (
                session.query(SysDeptEntity)
                .filter(SysDeptEntity.id.in_(dept_ids))
                .all()
            )
            departments = [self._to_dept_response(dept) for dept in dept_entities]

        return self._build_user_response_from_relations(user, roles, departments)

    @staticmethod
    def _to_role_response(role: SysRoleEntity) -> RoleResponse:
        return RoleResponse(
            id=role.id,
            role_code=role.role_code,
            role_name=role.role_name,
            description=role.description,
            status=role.status,
        )

    @staticmethod
    def _to_dept_response(dept: SysDeptEntity) -> DeptResponse:
        return DeptResponse(
            id=dept.id,
            dept_name=dept.dept_name,
            dept_code=dept.dept_code,
            parent_id=dept.parent_id,
            status=dept.status,
        )

    @staticmethod
    def _build_user_response_from_relations(
        user: SysUserEntity,
        roles: List[RoleResponse],
        departments: List[DeptResponse],
    ) -> UserResponse:

        gmt_created_str = (
            user.gmt_created.strftime("%Y-%m-%d %H:%M:%S")
            if user.gmt_created
            else None
        )
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            real_name=user.real_name,
            phone=user.phone,
            status=user.status,
            roles=roles,
            departments=departments,
            gmt_created=gmt_created_str,
        )

    def _build_dept_tree(self, depts: List[SysDeptEntity]) -> List[DeptResponse]:
        """Build department tree from flat list"""
        dept_map: Dict[int, DeptResponse] = {}
        for d in depts:
            dept_map[d.id] = DeptResponse(
                id=d.id,
                dept_name=d.dept_name,
                dept_code=d.dept_code,
                parent_id=d.parent_id,
                status=d.status,
                children=[],
            )

        roots: List[DeptResponse] = []
        for dept_resp in dept_map.values():
            if dept_resp.parent_id == 0 or dept_resp.parent_id not in dept_map:
                roots.append(dept_resp)
            else:
                parent = dept_map[dept_resp.parent_id]
                parent.children.append(dept_resp)

        return roots
