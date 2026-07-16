"""Serve component that embeds governance in the DB-GPT API server."""

from typing import List, Optional, Union

from sqlalchemy import URL

from dbgpt.component import SystemApp
from dbgpt.storage.metadata import DatabaseManager
from dbgpt_serve.core import BaseServe
from dbgpt_serve.governance.api.endpoints import init_endpoints, router
from dbgpt_serve.governance.config import (
    APP_NAME,
    SERVE_APP_NAME,
    SERVE_APP_NAME_HUMP,
    SERVE_CONFIG_KEY_PREFIX,
    ServeConfig,
)
from dbgpt_serve.governance.service import GovernanceService


class GovernanceServe(BaseServe):
    """Register governance routes and services in the main DB-GPT process."""

    name = SERVE_APP_NAME

    def __init__(
        self,
        system_app: SystemApp,
        config: Optional[ServeConfig] = None,
        api_prefix: str = f"/api/v1/serve/{APP_NAME}",
        api_tags: Optional[List[str]] = None,
        db_url_or_db: Union[str, URL, DatabaseManager] = None,
        try_create_tables: Optional[bool] = False,
    ):
        super().__init__(
            system_app,
            api_prefix,
            api_tags or [SERVE_APP_NAME_HUMP],
            db_url_or_db,
            try_create_tables,
        )
        self._config = config
        self._service: Optional[GovernanceService] = None

    def init_app(self, system_app: SystemApp):
        if self._app_has_initiated:
            return
        self._system_app = system_app
        self._system_app.app.include_router(router, prefix=self._api_prefix, tags=self._api_tags)
        self._app_has_initiated = True

    def on_init(self):
        from . import models as _  # noqa: F401

    def before_start(self):
        config = self._config or ServeConfig.from_app_config(
            self._system_app.config, SERVE_CONFIG_KEY_PREFIX
        )
        if not config.enabled:
            return
        self._service = GovernanceService(
            self._system_app, self.create_or_get_db_manager(), config
        )
        init_endpoints(self._system_app, self._service)

    @property
    def service(self) -> Optional[GovernanceService]:
        return self._service
