import logging
import os
from typing import Optional

from fastapi import Header

from dbgpt._private.pydantic import BaseModel

logger = logging.getLogger(__name__)


class UserRequest(BaseModel):
    user_id: Optional[str] = None
    user_no: Optional[str] = None
    real_name: Optional[str] = None
    # same with user_id
    user_name: Optional[str] = None
    user_channel: Optional[str] = None
    role: Optional[str] = "normal"
    nick_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    nick_name_like: Optional[str] = None
    dept_id: Optional[str] = None
    dept_name: Optional[str] = None
    dept_code: Optional[str] = None


def get_user_from_headers(
    user_id: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
):
    auth_type = os.environ.get("DBGPT_AUTH_TYPE", "mock")

    if auth_type == "db" and authorization:
        try:
            # 延迟导入避免循环依赖
            from dbgpt_serve.permission.service.service import PermissionService

            # 从 Authorization header 解析 token
            token = (
                authorization.replace("Bearer ", "")
                if authorization.startswith("Bearer ")
                else authorization
            )

            # 验证 token 并获取用户信息
            payload = PermissionService.verify_token_static(token)
            if payload:
                return UserRequest(
                    user_id=str(payload.get("user_id", "")),
                    user_name=payload.get("username", ""),
                    real_name=payload.get("username", ""),
                    nick_name=payload.get("username", ""),
                    role=payload.get("role", "normal"),
                    dept_id=str(payload.get("dept_id", ""))
                    if payload.get("dept_id")
                    else None,
                    dept_name=payload.get("dept_name"),
                    dept_code=payload.get("dept_code"),
                )
        except Exception as e:
            logger.warning(f"DB auth failed, falling back to mock: {e}")

    # Mock 模式（默认行为，向后兼容）
    try:
        if user_id:
            return UserRequest(
                user_id=user_id, role="admin", nick_name=user_id, real_name=user_id
            )
        else:
            return UserRequest(
                user_id="001", role="admin", nick_name="dbgpt", real_name="dbgpt"
            )
    except Exception as e:
        logging.exception("Authentication failed!")
        raise Exception(f"Authentication failed. {str(e)}")
