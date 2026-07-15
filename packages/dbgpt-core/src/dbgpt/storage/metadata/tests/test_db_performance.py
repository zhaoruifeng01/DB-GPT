import logging

from sqlalchemy import text

from dbgpt.storage.metadata.db_manager import DatabaseManager
from dbgpt.util.db_performance import configure_slow_query_logging


def setup_function():
    configure_slow_query_logging()


def teardown_function():
    configure_slow_query_logging()


def test_slow_query_logging_is_disabled_by_default(caplog):
    db = DatabaseManager()
    db.init_db("sqlite:///:memory:")

    with caplog.at_level(logging.WARNING, logger="dbgpt.util.db_performance"):
        with db.session(commit=False) as session:
            session.execute(text("SELECT 'literal-secret'"))

    assert "Slow database query" not in caplog.text


def test_slow_query_logging_redacts_literals_and_parameters(caplog):
    configure_slow_query_logging(enabled=True, threshold_ms=0, max_sql_length=20)
    db = DatabaseManager()
    db.init_db("sqlite:///:memory:")

    with caplog.at_level(logging.WARNING, logger="dbgpt.util.db_performance"):
        with db.session(commit=False) as session:
            session.execute(
                text("SELECT 'literal-secret', :bound_secret"),
                {"bound_secret": "parameter-secret"},
            )

    assert "Slow database query" in caplog.text
    assert "literal-secret" not in caplog.text
    assert "parameter-secret" not in caplog.text
    assert "sql=SELECT ?, ?" in caplog.text
