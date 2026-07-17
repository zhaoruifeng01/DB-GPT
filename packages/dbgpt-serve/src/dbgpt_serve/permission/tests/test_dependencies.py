import pytest
from fastapi import HTTPException

from dbgpt_serve.permission.api.dependencies import (
    Principal,
    require_permission_manage,
    require_principal,
)
from dbgpt_serve.permission.api.schemas import UserResponse
from dbgpt_serve.permission.config import DEFAULT_JWT_SECRET_KEY, ServeConfig


class FakePermissionService:
    def __init__(self, payload=None, user=None):
        self.payload = payload
        self.user = user

    def verify_token(self, token):
        return self.payload if token == "valid" else None

    def get_user(self, user_id):
        return self.user


def test_require_principal_rejects_missing_or_invalid_token():
    service = FakePermissionService()

    with pytest.raises(HTTPException) as missing:
        require_principal(service, None)
    with pytest.raises(HTTPException) as invalid:
        require_principal(service, "Bearer invalid")

    assert missing.value.status_code == 401
    assert invalid.value.status_code == 401


def test_require_principal_rejects_disabled_user():
    service = FakePermissionService(
        payload={"user_id": 1},
        user=UserResponse(id=1, username="alice", status=0),
    )

    with pytest.raises(HTTPException) as exc:
        require_principal(service, "Bearer valid")

    assert exc.value.status_code == 401


def test_permission_manage_requires_admin_or_permission_role():
    with pytest.raises(HTTPException) as exc:
        require_permission_manage(
            Principal(user_id=1, username="alice", role_codes=["normal"])
        )
    assert exc.value.status_code == 403

    assert require_permission_manage(
        Principal(user_id=2, username="admin", role_codes=["admin"])
    ).is_admin
    assert require_permission_manage(
        Principal(user_id=3, username="sec", role_codes=["permission.manage"])
    ).can_manage_permissions


def test_production_rejects_default_jwt_secret(monkeypatch):
    monkeypatch.setenv("DBGPT_ENV", "production")

    with pytest.raises(ValueError, match="Default permission JWT secret"):
        ServeConfig(jwt_secret_key=DEFAULT_JWT_SECRET_KEY).validate_security()

    ServeConfig(jwt_secret_key="x" * 32).validate_security()
