from sqlalchemy import event

from dbgpt.storage.metadata import DatabaseManager, Model

from dbgpt_serve.permission.config import ServeConfig
from dbgpt_serve.permission.models.models import (
    SysDeptEntity,
    SysRoleEntity,
    SysUserDeptEntity,
    SysUserEntity,
    SysUserRoleEntity,
)
from dbgpt_serve.permission.service.service import PermissionService


def test_list_users_bulk_loads_relationships(tmp_path):
    db = DatabaseManager.build_from(
        f"sqlite:///{tmp_path / 'permission.db'}", base=Model
    )
    db.create_all()
    service = PermissionService(db, ServeConfig())

    with db.session() as session:
        role = SysRoleEntity(role_code="member", role_name="Member", status=1)
        dept = SysDeptEntity(
            dept_name="Engineering", dept_code="engineering", status=1
        )
        session.add_all([role, dept])
        session.flush()
        for index in range(20):
            user = SysUserEntity(
                username=f"user-{index}",
                password_hash="unused",
                status=1,
                deleted=0,
            )
            session.add(user)
            session.flush()
            session.add(SysUserRoleEntity(user_id=user.id, role_id=role.id))
            session.add(SysUserDeptEntity(user_id=user.id, dept_id=dept.id))

    statement_count = 0

    def count_statements(conn, cursor, statement, parameters, context, executemany):
        nonlocal statement_count
        statement_count += 1

    event.listen(db.engine, "before_cursor_execute", count_statements)
    try:
        result = service.list_users(page=1, page_size=20)
    finally:
        event.remove(db.engine, "before_cursor_execute", count_statements)

    assert statement_count == 6
    assert result["total"] == 20
    assert len(result["items"]) == 20
    assert all(item.roles[0].role_code == "member" for item in result["items"])
    assert all(
        item.departments[0].dept_code == "engineering" for item in result["items"]
    )
