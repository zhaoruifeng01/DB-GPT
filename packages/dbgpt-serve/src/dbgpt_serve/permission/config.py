import os
from dataclasses import dataclass, field
from typing import Optional

from dbgpt_serve.core import BaseServeConfig

APP_NAME = "permission"
SERVE_APP_NAME = "dbgpt_serve_permission"
SERVE_APP_NAME_HUMP = "dbgpt_serve_Permission"
SERVE_CONFIG_KEY_PREFIX = "dbgpt.serve.permission."
SERVE_SERVICE_COMPONENT_NAME = f"{SERVE_APP_NAME}_service"
DEFAULT_JWT_SECRET_KEY = "dbgpt-secret-key-for-hs256-signing!"


def is_production_environment() -> bool:
    """Return whether the current process is configured as production."""
    env = (
        os.getenv("DBGPT_ENV") or os.getenv("APP_ENV") or os.getenv("ENV") or ""
    ).lower()
    return env in {"prod", "production"}


@dataclass
class ServeConfig(BaseServeConfig):
    """Parameters for the permission serve command"""

    __type__ = APP_NAME

    jwt_secret_key: Optional[str] = field(
        default=DEFAULT_JWT_SECRET_KEY,
        metadata={"help": "JWT secret key (at least 32 bytes for HS256)"},
    )
    jwt_expire_seconds: Optional[int] = field(
        default=86400,
        metadata={"help": "JWT token expire time in seconds"},
    )
    allow_default_jwt_secret: bool = field(
        default=False,
        metadata={"help": "Allow the development default JWT secret key"},
    )

    def validate_security(self) -> None:
        """Validate security-sensitive configuration before serving traffic."""
        secret = (self.jwt_secret_key or "").strip()
        if len(secret.encode("utf-8")) < 32:
            raise ValueError("Permission JWT secret key must be at least 32 bytes")
        if (
            is_production_environment()
            and not self.allow_default_jwt_secret
            and secret == DEFAULT_JWT_SECRET_KEY
        ):
            raise ValueError(
                "Default permission JWT secret key is forbidden in production"
            )
