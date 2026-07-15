"""Shared SQLAlchemy performance instrumentation."""

import logging
import re
import threading
import time
from dataclasses import dataclass

from sqlalchemy import event
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SlowQueryLoggingConfig:
    """Process-wide slow SQL logging options."""

    enabled: bool = False
    threshold_ms: int = 500
    max_sql_length: int = 1000


_config_lock = threading.Lock()
_config = SlowQueryLoggingConfig()


def configure_slow_query_logging(
    enabled: bool = False,
    threshold_ms: int = 500,
    max_sql_length: int = 1000,
) -> None:
    """Configure slow query logging for engines created in this process."""
    if threshold_ms < 0:
        raise ValueError("threshold_ms must be greater than or equal to 0")
    if max_sql_length <= 0:
        raise ValueError("max_sql_length must be greater than 0")

    global _config
    with _config_lock:
        _config = SlowQueryLoggingConfig(
            enabled=enabled,
            threshold_ms=threshold_ms,
            max_sql_length=max_sql_length,
        )


def attach_slow_query_logger(engine: Engine) -> None:
    """Attach the shared timing hooks to an engine once."""
    if getattr(engine, "_dbgpt_slow_query_logger_attached", False):
        return

    @event.listens_for(engine, "before_cursor_execute")
    def _before_cursor_execute(
        conn, cursor, statement, parameters, context, executemany
    ):
        context._dbgpt_query_started_at = time.perf_counter()

    @event.listens_for(engine, "after_cursor_execute")
    def _after_cursor_execute(
        conn, cursor, statement, parameters, context, executemany
    ):
        started_at = getattr(context, "_dbgpt_query_started_at", None)
        if started_at is None:
            return

        duration_ms = (time.perf_counter() - started_at) * 1000
        with _config_lock:
            config = _config
        if not config.enabled or duration_ms < config.threshold_ms:
            return

        try:
            pool_status = engine.pool.status()
        except Exception:
            pool_status = type(engine.pool).__name__

        logger.warning(
            "Slow database query: duration_ms=%.2f dialect=%s pool=%s sql=%s",
            duration_ms,
            engine.dialect.name,
            pool_status,
            _sanitize_sql(statement, config.max_sql_length),
        )

    engine._dbgpt_slow_query_logger_attached = True


def _sanitize_sql(statement: str, max_sql_length: int) -> str:
    """Keep SQL useful for diagnostics without emitting literal string values."""
    normalized = " ".join(statement.split())
    sanitized = re.sub(r"'(?:''|[^'])*'", "?", normalized)
    if len(sanitized) > max_sql_length:
        return sanitized[:max_sql_length] + "..."
    return sanitized
