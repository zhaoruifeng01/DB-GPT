"""Configuration for the embedded governance module."""

from dataclasses import dataclass, field

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
    query_enabled: bool = False
    api_key_enabled: bool = False
    query_row_limit: int = 1000
    query_rate_limit_per_minute: int = 60
    sql_guard_max_length: int = 10000
    sql_guard_max_tokens: int = 500
    sql_guard_max_nesting_depth: int = 20
    sql_guard_parse_timeout_seconds: float = 0.5
    sql_guard_read_only_prefixes: tuple[str, ...] = field(
        default=(
            "SELECT",
            "WITH",
            "SHOW",
            "DESCRIBE",
            "DESC",
            "EXPLAIN",
        )
    )
