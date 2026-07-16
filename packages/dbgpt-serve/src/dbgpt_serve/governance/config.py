"""Configuration for the embedded governance module."""

from dataclasses import dataclass

from dbgpt_serve.core import BaseServeConfig

APP_NAME = "governance"
SERVE_APP_NAME = "dbgpt_governance"
SERVE_APP_NAME_HUMP = "dbgpt_governance"
SERVE_CONFIG_KEY_PREFIX = "dbgpt.serve.governance."
SERVE_SERVICE_COMPONENT_NAME = f"{SERVE_APP_NAME}_service"


@dataclass
class ServeConfig(BaseServeConfig):
    """Parameters for the embedded data-governance service."""

    __type__ = APP_NAME

    enabled: bool = True
    query_row_limit: int = 1000
    query_rate_limit_per_minute: int = 60
