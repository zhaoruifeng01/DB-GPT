from dataclasses import dataclass, field
from typing import Optional

from dbgpt_serve.core import BaseServeConfig

APP_NAME = "permission"
SERVE_APP_NAME = "dbgpt_serve_permission"
SERVE_APP_NAME_HUMP = "dbgpt_serve_Permission"
SERVE_CONFIG_KEY_PREFIX = "dbgpt.serve.permission."
SERVE_SERVICE_COMPONENT_NAME = f"{SERVE_APP_NAME}_service"


@dataclass
class ServeConfig(BaseServeConfig):
    """Parameters for the permission serve command"""

    __type__ = APP_NAME

    jwt_secret_key: Optional[str] = field(
        default="dbgpt-secret-key-for-hs256-signing!",
        metadata={"help": "JWT secret key (at least 32 bytes for HS256)"},
    )
    jwt_expire_seconds: Optional[int] = field(
        default=86400,
        metadata={"help": "JWT token expire time in seconds"},
    )
