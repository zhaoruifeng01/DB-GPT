"""Authentication and authorization dependencies for Permission APIs."""

from dataclasses import dataclass
from typing import Optional, Sequence

from fastapi import Header, HTTPException

from ..api.schemas import UserResponse
from ..service.service import PermissionService


@dataclass(frozen=True)
class Principal:
    """Authenticated DB-GPT user used by permission management routes."""

    user_id: int
    username: str
    role_codes: Sequence[str]

    @property
    def is_admin(self) -> bool:
        return "admin" in self.role_codes

    @property
    def can_manage_permissions(self) -> bool:
        return self.is_admin or "permission.manage" in self.role_codes


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    return authorization[7:] if authorization.startswith("Bearer ") else authorization


def require_principal(
    service: PermissionService, authorization: Optional[str] = Header(None)
) -> Principal:
    """Resolve and validate the current principal from the Authorization header."""
    token = _extract_bearer_token(authorization)
    payload = service.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = service.get_user(int(payload["user_id"]))
    if not user or user.status != 1:
        raise HTTPException(status_code=401, detail="User is unavailable")
    return Principal(
        user_id=user.id,
        username=user.username,
        role_codes=[role.role_code for role in user.roles],
    )


def require_permission_manage(principal: Principal) -> Principal:
    """Require administrator or permission.manage authority."""
    if not principal.can_manage_permissions:
        raise HTTPException(status_code=403, detail="Permission management required")
    return principal


def user_to_principal(user: UserResponse) -> Principal:
    """Create a Principal from an already loaded user response."""
    return Principal(
        user_id=user.id,
        username=user.username,
        role_codes=[role.role_code for role in user.roles],
    )
