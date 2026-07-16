"""MaxCompute (ODPS) connector."""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Tuple, Type
from urllib.parse import quote

import sqlparse

from dbgpt.core.awel.flow import (
    TAGS_ORDER_HIGH,
    ResourceCategory,
    auto_register_resource,
)
from dbgpt.datasource.base import BaseConnector
from dbgpt.datasource.parameter import BaseDatasourceParameters
from dbgpt.util.i18n_utils import _

logger = logging.getLogger(__name__)


@auto_register_resource(
    label=_("MaxCompute datasource"),
    category=ResourceCategory.DATABASE,
    tags={"order": TAGS_ORDER_HIGH},
    description=_(
        "Alibaba Cloud MaxCompute (ODPS), a big data analytics platform for "
        "large-scale data warehousing."
    ),
)
@dataclass
class OdpsParameters(BaseDatasourceParameters):
    """MaxCompute connection parameters."""

    __type__ = "maxcompute"

    access_id: str = field(metadata={"help": _("Alibaba Cloud AccessKey ID")})
    access_key: str = field(
        metadata={
            "help": _(
                "Alibaba Cloud AccessKey Secret, you can write your key directly, "
                "or use environment variables, such as ${env:ODPS_ACCESS_KEY}"
            ),
            "tags": "privacy",
        }
    )
    project: str = field(metadata={"help": _("MaxCompute project name")})
    endpoint: str = field(
        default="https://service.cn-beijing.maxcompute.aliyun.com/api",
        metadata={
            "help": _(
                "MaxCompute endpoint for the project region and network type, "
                "for example https://service.cn-beijing.maxcompute.aliyun.com/api"
            )
        },
    )

    def create_connector(self) -> "OdpsConnector":
        """Create MaxCompute connector."""
        return OdpsConnector.from_parameters(self)

    def db_url(self, ssl: bool = False, charset: Optional[str] = None) -> str:
        """Return database engine url."""
        return f"odps://{self.access_id}@{self.endpoint}/{self.project}"

    @classmethod
    def _persisted_state_mapping(cls) -> Dict[str, str]:
        """Return the mapping of persisted state.

        The generic datasource store uses ``db_host`` to persist the endpoint.
        """
        return {
            "access_id": "db_user",
            "access_key": "db_pwd",
            "project": "db_name",
            "endpoint": "db_host",
        }


class OdpsConnector(BaseConnector):
    """MaxCompute (ODPS) connector based on PyODPS SDK."""

    db_type: str = "maxcompute"
    driver: str = "odps"
    dialect: str = "odps"

    def __init__(self, client: Any, **kwargs: Any):
        """Create a new OdpsConnector from a pyodps.ODPS client.

        Args:
            client: pyodps.ODPS instance
            kwargs: other args
        """
        self._client = client
        self._project = client.project
        self._all_tables: set = set()

    @classmethod
    def param_class(cls) -> Type[OdpsParameters]:
        """Return the parameter class."""
        return OdpsParameters

    @classmethod
    def from_parameters(cls, parameters: OdpsParameters) -> "OdpsConnector":
        """Create a new OdpsConnector from parameters."""
        try:
            from odps import ODPS
        except ImportError as exc:
            raise ImportError(
                "PyODPS is required to use the MaxCompute datasource. "
                "Install it with `pip install pyodps` or the "
                "`dbgpt-ext[datasource_maxcompute]` extra."
            ) from exc

        client = ODPS(
            parameters.access_id,
            parameters.access_key,
            project=parameters.project,
            endpoint=parameters.endpoint,
        )
        return cls(client)

    @property
    def client(self) -> Any:
        """Return the underlying pyodps.ODPS client."""
        return self._client

    @property
    def db_url(self) -> str:
        """Return database engine url."""
        return f"odps://{quote(self._project)}"

    def get_table_names(self) -> Iterable[str]:
        """Get all table names in the current project."""
        return [t.name for t in self._client.list_tables()]

    def get_usable_table_names(self) -> Iterable[str]:
        """Get names of tables available."""
        return self.get_table_names()

    def get_database_names(self) -> List[str]:
        """Return a list of project names available."""
        return [self._project]

    def get_current_db_name(self) -> str:
        """Get current project name."""
        return self._project

    def get_columns(self, table_name: str) -> List[Dict]:
        """Get columns about specified table.

        Returns:
            List[Dict], which contains name: str, type: str,
                default_expression: str, is_in_primary_key: bool, comment: str
        """
        table = self._client.get_table(table_name)
        columns = []
        partition_names = self._partition_names(table)
        for col in self._schema_columns(table):
            columns.append(
                {
                    "name": col.name,
                    "type": str(col.type),
                    "default_expression": "",
                    "is_in_primary_key": self._is_partition_column(
                        col, partition_names
                    ),
                    "comment": col.comment or "",
                }
            )
        return columns

    def get_fields(self, table_name: str, db_name: Optional[str] = None) -> List[Tuple]:
        """Get column fields about specified table.

        Returns:
            List[Tuple]: (column_name, column_type, column_default, is_nullable,
                column_comment)
        """
        table = self._client.get_table(table_name, project=db_name or self._project)
        fields = []
        for col in self._schema_columns(table):
            fields.append(
                (
                    col.name,
                    str(col.type),
                    "",
                    "NO" if getattr(col, "nullable", True) is False else "YES",
                    col.comment or "",
                )
            )
        return fields

    def get_simple_fields(self, table_name: str) -> List[Tuple]:
        """Get simple column fields about specified table."""
        return self.get_fields(table_name)

    def get_table_info(self, table_names: Optional[List[str]] = None) -> str:
        """Get information about specified tables.

        Builds a CREATE TABLE-like description for each table using the MaxCompute
        table schema.
        """
        if table_names is None:
            table_names = list(self.get_table_names())

        results = []
        for table_name in table_names:
            try:
                table = self._client.get_table(table_name)
            except Exception as e:
                logger.warning(f"Failed to get table {table_name}: {e}")
                continue

            col_lines = []
            for col in self._schema_columns(table):
                col_def = f"  `{col.name}` {col.type}"
                if col.comment:
                    col_def += f" COMMENT '{self._escape_comment(col.comment)}'"
                col_lines.append(col_def)

            create_sql = (
                f"CREATE TABLE `{table_name}` (\n"
                + ",\n".join(col_lines)
                + "\n)"
            )
            if table.comment:
                create_sql += f" COMMENT '{self._escape_comment(table.comment)}'"
            results.append(create_sql)
        return "\n\n".join(results)

    def get_table_info_no_throw(
        self, table_names: Optional[List[str]] = None
    ) -> str:
        """Get information about specified tables without raising."""
        try:
            return self.get_table_info(table_names)
        except Exception as e:
            return f"Error: {e}"

    def get_table_comment(self, table_name: str) -> Dict:
        """Get table comment.

        Returns:
            Dict, which contains text: Optional[str], eg: {"text": "comment"}
        """
        table = self._client.get_table(table_name)
        return {"text": table.comment or ""}

    def get_table_comments(self, db_name: str) -> List[Tuple[str, str]]:
        """Get table comments for all tables in a project."""
        results = []
        for t in self._client.list_tables():
            try:
                table = self._client.get_table(t.name)
                results.append((t.name, table.comment or ""))
            except Exception as e:
                logger.warning(f"Failed to get comment for table {t.name}: {e}")
                results.append((t.name, ""))
        return results

    def get_column_comments(self, db_name: str, table_name: str):
        """Get column comments for a table."""
        table = self._client.get_table(table_name, project=db_name or self._project)
        return [(col.name, col.comment or "") for col in self._schema_columns(table)]

    def get_indexes(self, table_name: str) -> List[Dict]:
        """Get table indexes.

        MaxCompute does not support traditional indexes, return partition keys as
        a pseudo-index for informational purposes.
        """
        table = self._client.get_table(table_name)
        partition_names = self._partition_names(table)
        partition_keys = [
            col.name
            for col in self._schema_columns(table)
            if self._is_partition_column(col, partition_names)
        ]
        if not partition_keys:
            return []
        return [{"name": "partition", "column_names": partition_keys}]

    def get_index_info(self, table_names: Optional[List[str]] = None) -> str:
        """Get index information about specified tables."""
        if table_names is None:
            table_names = list(self.get_table_names())

        results = []
        for table_name in table_names:
            indexes = self.get_indexes(table_name)
            if indexes:
                results.append(f"Table `{table_name}` indexes: {indexes}")
        return "\n".join(results)

    def get_show_create_table(self, table_name: str) -> str:
        """Get show create table about specified table."""
        table = self._client.get_table(table_name)
        schema = getattr(table, "schema", None)
        if isinstance(schema, str) and schema:
            return schema
        return self.get_table_info([table_name])

    def get_collation(self) -> Optional[str]:
        """Get collation."""
        return "UTF-8"

    def get_charset(self) -> str:
        """Get character_set."""
        return "UTF-8"

    def get_users(self) -> List[Tuple[str, str]]:
        """Get user info."""
        return []

    def get_grants(self) -> List[Tuple]:
        """Get grants."""
        return []

    def table_simple_info(self) -> Iterable[str]:
        """Get table simple info."""
        results = []
        for t in self._client.list_tables():
            try:
                table = self._client.get_table(t.name)
                col_names = [col.name for col in self._schema_columns(table)]
                results.append(f"{t.name}({','.join(col_names)})")
            except Exception as e:
                logger.warning(f"Failed to get schema for table {t.name}: {e}")
        return results

    def run(self, command: str, fetch: str = "all") -> List:
        """Execute a SQL command and return the results as a list of tuples."""
        logger.info("SQL:" + command)
        if not command:
            return []

        command = command.strip().rstrip(";")
        if not command:
            return []

        parsed_statements = sqlparse.parse(command)
        if not parsed_statements:
            return []

        parsed = parsed_statements[0]
        sql_type = parsed.get_type()

        if sql_type == "SELECT" or command.lower().startswith(
            ("select", "show", "desc", "with", "explain")
        ):
            return self._query(command, fetch)
        else:
            return self._execute_ddl_or_dml(command)

    def run_no_throw(self, command: str, fetch: str = "all") -> List:
        """Execute a SQL command and return results, or empty list on error."""
        try:
            return self.run(command, fetch)
        except Exception as e:
            logger.warning(f"Run SQL command failed: {e}")
            return []

    def run_to_df(self, command: str, fetch: str = "all"):
        """Execute sql command and return result as dataframe."""
        import pandas as pd

        result_lst = self.run(command, fetch)
        if not result_lst:
            return pd.DataFrame()
        columns = result_lst[0]
        values = result_lst[1:]
        return pd.DataFrame(values, columns=columns)

    def query_ex(
        self,
        query: str,
        params: Optional[Dict[str, Any]] = None,
        fetch: str = "all",
        timeout: Optional[float] = None,
    ) -> Tuple[List[str], Optional[List]]:
        """Execute a SQL command and return the results with optional timeout."""
        if not query:
            return [], None
        query = query.strip().rstrip(";")
        logger.info(f"Query[{query}] with timeout={timeout}s")

        try:
            instance = self._client.execute_sql(query)
            with instance.open_reader(tunnel=True) as reader:
                field_names = [col.name for col in reader._schema.columns]
                rows = []
                for record in reader:
                    rows.append([v for v in record])
                    if fetch == "one" and len(rows) >= 1:
                        break
                if fetch == "one":
                    return field_names, rows[:1]
                return field_names, rows
        except Exception as e:
            logger.warning(f"Query failed: {e}")
            raise

    def _query(self, query: str, fetch: str = "all") -> List:
        """Run a SQL query and return the results as a list of tuples."""
        logger.info(f"Query[{query}]")
        if not query:
            return []

        instance = self._client.execute_sql(query)
        with instance.open_reader(tunnel=True) as reader:
            field_names = [col.name for col in reader._schema.columns]
            results = []
            for record in reader:
                results.append([v for v in record])
                if fetch == "one" and len(results) >= 1:
                    break
            results.insert(0, tuple(field_names))
            return results

    def _execute_ddl_or_dml(self, command: str) -> List:
        """Execute DDL/DML command and return simple result."""
        logger.info(f"Execute[{command}]")
        instance = self._client.execute_sql(command)
        instance.wait_for_success()
        # Try to return a simple result
        try:
            with instance.open_reader(tunnel=True) as reader:
                field_names = (
                    [col.name for col in reader._schema.columns]
                    if reader._schema
                    else []
                )
                if not field_names:
                    return []
                results = []
                for record in reader:
                    results.append([v for v in record])
                results.insert(0, tuple(field_names))
                return results
        except Exception:
            return []

    def close(self):
        """Close the connector.

        PyODPS does not require explicit connection close, this is a no-op.
        """
        pass

    @staticmethod
    def _schema_columns(table: Any) -> List[Any]:
        """Return normal and partition columns from a PyODPS table schema."""
        schema = table.table_schema
        columns = list(getattr(schema, "columns", []) or [])
        partitions = list(getattr(schema, "partitions", []) or [])
        return columns + partitions

    @staticmethod
    def _partition_names(table: Any) -> set:
        """Return partition column names from a PyODPS table schema."""
        partitions = getattr(table.table_schema, "partitions", []) or []
        return {col.name for col in partitions}

    @staticmethod
    def _is_partition_column(col: Any, partition_names: set) -> bool:
        """Return whether a column is a MaxCompute partition column."""
        return (
            bool(getattr(col, "is_partition_key", False))
            or col.name in partition_names
        )

    @staticmethod
    def _escape_comment(comment: str) -> str:
        """Escape single quotes in comments used in generated SQL snippets."""
        return comment.replace("'", "\\'")
