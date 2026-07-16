"""Unit tests for the MaxCompute (ODPS) connector."""

import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import MagicMock

from dbgpt_ext.datasource.rdbms.conn_odps import OdpsConnector, OdpsParameters


def test_odps_parameters_db_url():
    params = OdpsParameters(
        access_id="test_access_id",
        access_key="test_access_key",
        project="test_project",
        endpoint="https://service.cn-beijing.maxcompute.aliyun.com/api",
    )
    assert params.db_url() == (
        "odps://test_access_id@https://service.cn-beijing.maxcompute.aliyun.com/api/"
        "test_project"
    )


def test_odps_parameters_default_endpoint():
    params = OdpsParameters(
        access_id="aid",
        access_key="asecret",
        project="proj",
    )
    assert params.endpoint == "https://service.cn-beijing.maxcompute.aliyun.com/api"


def test_odps_parameters_persisted_state_mapping():
    params = OdpsParameters(
        access_id="aid",
        access_key="asecret",
        project="proj",
        endpoint="https://example.com",
    )
    state = params.persisted_state()
    assert state["db_type"] == "maxcompute"
    assert state["db_user"] == "aid"
    assert state["db_pwd"] == "asecret"
    assert state["db_name"] == "proj"
    assert state["db_host"] == "https://example.com"


def test_odps_parameters_persisted_state_roundtrip():
    params = OdpsParameters(
        access_id="aid",
        access_key="asecret",
        project="proj",
        endpoint="https://example.com",
    )
    state = params.persisted_state()
    restored = OdpsParameters.from_persisted_state(state)
    assert restored.access_id == "aid"
    assert restored.access_key == "asecret"
    assert restored.project == "proj"
    assert restored.endpoint == "https://example.com"


def test_odps_parameters_create_connector(monkeypatch):
    params = OdpsParameters(
        access_id="aid",
        access_key="asecret",
        project="proj",
        endpoint="https://service.cn-beijing.maxcompute.aliyun.com/api",
    )
    sentinel = object()

    def fake_from_parameters(cls, parameters):
        assert parameters is params
        return sentinel

    monkeypatch.setattr(
        OdpsConnector,
        "from_parameters",
        classmethod(fake_from_parameters),
    )
    assert params.create_connector() is sentinel


def test_connector_manager_restores_odps_from_persisted_parameters(monkeypatch):
    from dbgpt_serve.datasource.manages.connector_manager import ConnectorManager

    sentinel = object()
    created_parameters = []

    def fake_from_parameters(cls, parameters):
        created_parameters.append(parameters)
        return sentinel

    monkeypatch.setattr(
        OdpsConnector,
        "from_parameters",
        classmethod(fake_from_parameters),
    )
    manager = ConnectorManager.__new__(ConnectorManager)
    manager.storage = MagicMock()
    manager.storage.get_db_config.return_value = {
        "db_type": "maxcompute",
        "db_name": "analytics_project",
        "db_host": "https://service.cn-beijing.maxcompute.aliyun.com/api",
        "db_user": "test_access_id",
        "db_pwd": "test_access_key",
        "ext_config": None,
    }
    manager.get_cls_by_dbtype = MagicMock(return_value=OdpsConnector)

    assert manager._build_connector("analytics_project") is sentinel
    params = created_parameters[0]
    assert params.access_id == "test_access_id"
    assert params.access_key == "test_access_key"
    assert params.project == "analytics_project"
    assert params.endpoint == "https://service.cn-beijing.maxcompute.aliyun.com/api"


def test_odps_connector_from_parameters(monkeypatch):
    params = OdpsParameters(
        access_id="aid",
        access_key="asecret",
        project="proj",
        endpoint="https://example.com",
    )
    fake_odps = MagicMock()
    fake_client = MagicMock()
    fake_client.project = "proj"
    fake_odps.return_value = fake_client
    fake_odps_module = ModuleType("odps")
    fake_odps_module.ODPS = fake_odps
    monkeypatch.setitem(sys.modules, "odps", fake_odps_module)

    connector = OdpsConnector.from_parameters(params)
    fake_odps.assert_called_once_with(
        "aid",
        "asecret",
        project="proj",
        endpoint="https://example.com",
    )
    assert connector.client is fake_client
    assert connector._project == "proj"


def test_odps_connector_get_table_names():
    connector = _make_connector_with_mock_client()
    connector._client.list_tables.return_value = [
        SimpleNamespace(name="t1"),
        SimpleNamespace(name="t2"),
    ]
    names = list(connector.get_table_names())
    assert names == ["t1", "t2"]


def test_odps_connector_get_columns():
    connector = _make_connector_with_mock_client()
    col1 = _make_column("id", "BIGINT", "primary id")
    col2 = _make_column("dt", "STRING", "partition date")
    table = _make_table([col1], partitions=[col2])
    connector._client.get_table.return_value = table

    columns = connector.get_columns("test_table")
    assert columns == [
        {
            "name": "id",
            "type": "BIGINT",
            "default_expression": "",
            "is_in_primary_key": False,
            "comment": "primary id",
        },
        {
            "name": "dt",
            "type": "STRING",
            "default_expression": "",
            "is_in_primary_key": True,
            "comment": "partition date",
        },
    ]


def test_odps_connector_get_table_info():
    connector = _make_connector_with_mock_client()
    col1 = _make_column("id", "BIGINT", "id column")
    col2 = _make_column("name", "STRING")
    table = _make_table([col1, col2], comment="test table comment")
    connector._client.get_table.return_value = table

    info = connector.get_table_info(["test_table"])
    assert "CREATE TABLE `test_table`" in info
    assert "`id` BIGINT" in info
    assert "COMMENT 'id column'" in info
    assert "`name` STRING" in info
    assert "COMMENT 'test table comment'" in info


def test_odps_connector_get_indexes_returns_partitions():
    connector = _make_connector_with_mock_client()
    table = _make_table(
        [_make_column("id", "BIGINT")],
        partitions=[_make_column("dt", "STRING")],
    )
    connector._client.get_table.return_value = table

    assert connector.get_indexes("test_table") == [
        {"name": "partition", "column_names": ["dt"]}
    ]


def test_odps_connector_run_select():
    connector = _make_connector_with_mock_client()
    instance = MagicMock()
    reader = MagicMock()
    schema = MagicMock()
    col_id = MagicMock()
    col_id.name = "id"
    col_val = MagicMock()
    col_val.name = "val"
    schema.columns = [col_id, col_val]
    reader._schema = schema
    reader.__iter__ = MagicMock(return_value=iter([[1, "a"], [2, "b"]]))
    instance.open_reader.return_value.__enter__.return_value = reader
    connector._client.execute_sql.return_value = instance

    result = connector.run("SELECT id, val FROM test_table")
    assert result[0] == ("id", "val")
    assert result[1] == [1, "a"]
    assert result[2] == [2, "b"]


def test_odps_connector_run_strips_trailing_semicolon():
    connector = _make_connector_with_mock_client()
    instance = MagicMock()
    reader = MagicMock()
    schema = MagicMock()
    col = MagicMock()
    col.name = "c"
    schema.columns = [col]
    reader._schema = schema
    reader.__iter__ = MagicMock(return_value=iter([[1]]))
    instance.open_reader.return_value.__enter__.return_value = reader
    connector._client.execute_sql.return_value = instance

    connector.run("SELECT 1;")
    connector._client.execute_sql.assert_called_once_with("SELECT 1")


def test_odps_connector_run_empty():
    connector = _make_connector_with_mock_client()
    assert connector.run("") == []
    assert connector.run(" ; ") == []


def test_odps_connector_run_no_throw_swallows_errors():
    connector = _make_connector_with_mock_client()
    connector._client.execute_sql.side_effect = RuntimeError("boom")
    assert connector.run_no_throw("SELECT 1") == []


def test_odps_connector_query_ex():
    connector = _make_connector_with_mock_client()
    instance = MagicMock()
    reader = MagicMock()
    schema = MagicMock()
    col = MagicMock()
    col.name = "c"
    schema.columns = [col]
    reader._schema = schema
    reader.__iter__ = MagicMock(return_value=iter([[1], [2]]))
    instance.open_reader.return_value.__enter__.return_value = reader
    connector._client.execute_sql.return_value = instance

    field_names, rows = connector.query_ex("SELECT c FROM t")
    assert field_names == ["c"]
    assert rows == [[1], [2]]


def test_odps_connector_query_ex_fetch_one():
    connector = _make_connector_with_mock_client()
    instance = MagicMock()
    reader = MagicMock()
    schema = MagicMock()
    col = MagicMock()
    col.name = "c"
    schema.columns = [col]
    reader._schema = schema
    reader.__iter__ = MagicMock(return_value=iter([[1], [2]]))
    instance.open_reader.return_value.__enter__.return_value = reader
    connector._client.execute_sql.return_value = instance

    field_names, rows = connector.query_ex("SELECT c FROM t", fetch="one")
    assert field_names == ["c"]
    assert rows == [[1]]


def test_odps_connector_close_is_noop():
    connector = _make_connector_with_mock_client()
    # Should not raise
    connector.close()


def _make_connector_with_mock_client() -> OdpsConnector:
    client = MagicMock()
    client.project = "proj"
    return OdpsConnector(client)


def _make_column(
    name: str,
    col_type: str,
    comment: str = "",
    is_partition_key: bool = False,
    nullable: bool = True,
):
    return SimpleNamespace(
        name=name,
        type=col_type,
        comment=comment,
        is_partition_key=is_partition_key,
        nullable=nullable,
    )


def _make_table(columns, partitions=None, comment: str = ""):
    table = MagicMock()
    table.comment = comment
    table.table_schema = SimpleNamespace(
        columns=columns,
        partitions=partitions or [],
    )
    return table
