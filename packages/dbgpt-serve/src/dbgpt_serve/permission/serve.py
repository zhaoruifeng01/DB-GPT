"""Permission Serve component"""

import logging
from typing import List, Optional, Union

from sqlalchemy import URL

from dbgpt.component import SystemApp
from dbgpt.storage.metadata import DatabaseManager
from dbgpt_serve.core import BaseServe

from .api.endpoints import init_endpoints, router, set_service
from .config import (
    APP_NAME,
    SERVE_APP_NAME,
    SERVE_APP_NAME_HUMP,
    SERVE_CONFIG_KEY_PREFIX,
    ServeConfig,
)
from .service.service import PermissionService

logger = logging.getLogger(__name__)


class Serve(BaseServe):
    """Permission Serve component

    Provides user, role, and department management with JWT authentication.
    """

    name = SERVE_APP_NAME

    def __init__(
        self,
        system_app: SystemApp,
        config: Optional[ServeConfig] = None,
        api_prefix: Optional[str] = f"/api/v1/serve/{APP_NAME}",
        api_tags: Optional[List[str]] = None,
        db_url_or_db: Union[str, URL, DatabaseManager] = None,
        try_create_tables: Optional[bool] = False,
    ):
        if api_tags is None:
            api_tags = [SERVE_APP_NAME_HUMP]
        super().__init__(
            system_app, api_prefix, api_tags, db_url_or_db, try_create_tables
        )
        self._config = config
        self._db_manager: Optional[DatabaseManager] = None
        self._service: Optional[PermissionService] = None

    def init_app(self, system_app: SystemApp):
        if self._app_has_initiated:
            return
        self._system_app = system_app
        self._system_app.app.include_router(
            router, prefix=self._api_prefix, tags=self._api_tags
        )

        config = self._config or ServeConfig.from_app_config(
            system_app.config, SERVE_CONFIG_KEY_PREFIX
        )
        init_endpoints(self._system_app, config)
        self._app_has_initiated = True

    def on_init(self):
        """Called before the start of the application."""
        from .models.models import (  # noqa: F401
            SysDeptEntity,
            SysRoleEntity,
            SysUserDeptEntity,
            SysUserEntity,
            SysUserRoleEntity,
        )

    def before_start(self):
        """Called before the start of the application."""
        self._db_manager = self.create_or_get_db_manager()

        config = self._config or ServeConfig.from_app_config(
            self._system_app.config, SERVE_CONFIG_KEY_PREFIX
        )
        config.validate_security()
        self._service = PermissionService(self._db_manager, config)

        # Set service in endpoints module
        set_service(self._service)

        # Initialize default data
        self._service.init_default_data()

    @property
    def service(self) -> Optional[PermissionService]:
        """Get the permission service"""
        return self._service
