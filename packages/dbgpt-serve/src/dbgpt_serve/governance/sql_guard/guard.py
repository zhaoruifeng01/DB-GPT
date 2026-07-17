"""Conservative SQL validation for governance query execution."""

import re
import time
from dataclasses import dataclass
from typing import FrozenSet, Iterable, Sequence

import sqlparse
from fastapi import HTTPException
from sqlparse.sql import Identifier, IdentifierList, Parenthesis, TokenList
from sqlparse.tokens import DDL, DML, Comment, Keyword, Whitespace

try:
    from sqlparse.exceptions import SQLParseError
except Exception:  # pragma: no cover - compatibility with older sqlparse releases.
    SQLParseError = Exception


_WRITE_KEYWORDS = {
    "ALTER",
    "ANALYZE",
    "ATTACH",
    "CALL",
    "COPY",
    "CREATE",
    "DELETE",
    "DETACH",
    "DROP",
    "EXEC",
    "EXECUTE",
    "GRANT",
    "INSERT",
    "MERGE",
    "REINDEX",
    "REPLACE",
    "REVOKE",
    "TRUNCATE",
    "UPDATE",
    "UPSERT",
    "VACUUM",
}
_RESOURCE_INTRODUCERS = {"FROM", "JOIN", "INTO", "UPDATE"}


@dataclass(frozen=True)
class SqlGuardConfig:
    """Limits applied before a governed SQL statement can execute."""

    max_length: int = 10000
    max_tokens: int = 500
    max_nesting_depth: int = 20
    parse_timeout_seconds: float = 0.5
    read_only_prefixes: Sequence[str] = (
        "SELECT",
        "WITH",
        "SHOW",
        "DESCRIBE",
        "DESC",
        "EXPLAIN",
    )


@dataclass(frozen=True)
class SqlGuardResult:
    """Validated SQL statement and extracted resource names."""

    statement: str
    tables: FrozenSet[str]


class SqlGuard:
    """Reject unknown or unsafe SQL before ConnectorManager sees it."""

    def __init__(self, config: SqlGuardConfig):
        self._config = config
        self._read_only_prefixes = {
            prefix.upper() for prefix in config.read_only_prefixes
        }

    def validate(self, sql: str) -> SqlGuardResult:
        statement = self._normalize_statement(sql)
        started_at = time.monotonic()
        try:
            parsed = sqlparse.parse(statement)
        except SQLParseError as exc:
            raise HTTPException(status_code=400, detail="SQL parse failed") from exc
        except Exception as exc:
            raise HTTPException(status_code=400, detail="SQL parse failed") from exc

        self._check_parse_budget(started_at)
        if len(parsed) != 1:
            raise HTTPException(
                status_code=400, detail="Only one SQL statement is allowed"
            )

        stmt = parsed[0]
        tokens = [
            token
            for token in stmt.flatten()
            if not token.is_whitespace and token.ttype not in Comment
        ]
        if len(tokens) > self._config.max_tokens:
            raise HTTPException(status_code=400, detail="SQL token limit exceeded")

        first = stmt.token_first(skip_ws=True, skip_cm=True)
        first_keyword = first.normalized.upper() if first else ""
        if first_keyword not in self._read_only_prefixes:
            raise HTTPException(status_code=400, detail="Only read-only SQL is allowed")

        for token in tokens:
            normalized = token.normalized.upper()
            if token.ttype in DDL or (token.ttype in DML and normalized != "SELECT"):
                raise HTTPException(
                    status_code=400, detail="Only read-only SQL is allowed"
                )
            if token.ttype in Keyword and normalized in _WRITE_KEYWORDS:
                raise HTTPException(
                    status_code=400, detail="Only read-only SQL is allowed"
                )

        if self._nesting_depth(stmt) > self._config.max_nesting_depth:
            raise HTTPException(status_code=400, detail="SQL nesting limit exceeded")

        return SqlGuardResult(statement=statement, tables=frozenset(self._tables(stmt)))

    def _normalize_statement(self, sql: str) -> str:
        if sql is None:
            raise HTTPException(status_code=400, detail="SQL is required")
        statement = sql.strip().rstrip(";").strip()
        if not statement:
            raise HTTPException(status_code=400, detail="SQL is required")
        if len(statement) > self._config.max_length:
            raise HTTPException(status_code=400, detail="SQL length limit exceeded")
        if ";" in statement:
            raise HTTPException(
                status_code=400,
                detail="Only one read-only SQL statement is allowed",
            )
        return statement

    def _check_parse_budget(self, started_at: float) -> None:
        if time.monotonic() - started_at > self._config.parse_timeout_seconds:
            raise HTTPException(status_code=400, detail="SQL parse timeout exceeded")

    def _nesting_depth(self, token_list: TokenList, depth: int = 0) -> int:
        max_depth = depth
        for token in getattr(token_list, "tokens", []):
            if isinstance(token, Parenthesis):
                max_depth = max(max_depth, self._nesting_depth(token, depth + 1))
            elif isinstance(token, TokenList):
                max_depth = max(max_depth, self._nesting_depth(token, depth))
        return max_depth

    def _tables(self, token_list: TokenList) -> Iterable[str]:
        tokens = list(getattr(token_list, "tokens", []))
        index = 0
        while index < len(tokens):
            token = tokens[index]
            if isinstance(token, TokenList):
                yield from self._tables(token)
            if (
                token.ttype in Keyword
                and token.normalized.upper() in _RESOURCE_INTRODUCERS
            ):
                next_token = self._next_significant(tokens, index + 1)
                if next_token is not None:
                    yield from self._identifier_names(next_token)
            index += 1

    @staticmethod
    def _next_significant(tokens: list, start: int):
        for token in tokens[start:]:
            if token.ttype in Whitespace or token.ttype in Comment:
                continue
            return token
        return None

    def _identifier_names(self, token) -> Iterable[str]:
        if isinstance(token, IdentifierList):
            for identifier in token.get_identifiers():
                yield from self._identifier_names(identifier)
            return
        if isinstance(token, Identifier):
            name = token.get_real_name() or token.get_name()
            if name:
                yield self._clean_name(name)
            return
        if isinstance(token, Parenthesis):
            yield from self._tables(token)
            return
        if isinstance(token, TokenList):
            yield from self._tables(token)
            return

        value = str(token).strip()
        if value:
            name = re.split(r"\s+", value, maxsplit=1)[0]
            yield self._clean_name(name.split(".")[-1])

    @staticmethod
    def _clean_name(name: str) -> str:
        return name.strip('`"[]')
