# Governance SQL Execution Points

This inventory gates rollout of the unified flow:

`Principal -> SQL Guard -> Resource Set -> Authorizer -> Connector -> Mask -> Audit`

| Entry point | Current file | Owner | Status | Required action |
| --- | --- | --- | --- | --- |
| Governance Query API | `packages/dbgpt-serve/src/dbgpt_serve/governance/api/endpoints.py` | Governance | Guarded and disabled by default | Keep disabled until Authorizer enforce and audit pass |
| Chat datasource operator | `packages/dbgpt-app/src/dbgpt_app/operators/datasource.py` | App/Agent | Not wired | Add shared governance facade before `query_to_df` |
| Chat dashboard loader | `packages/dbgpt-app/src/dbgpt_app/scene/chat_dashboard/data_loader.py` | App | Not wired | Add shared governance facade before `query_ex` |
| Chat dashboard service | `packages/dbgpt-app/src/dbgpt_app/scene/chat_dashboard/chat.py` | App | Not wired | Route generated chart SQL through governance facade |
| Core datasource connector `run` | `packages/dbgpt-core/src/dbgpt/datasource/rdbms/base.py` | Datasource | Not wired | Provide low-level interception hook or read-only enforcement |
| Core datasource `query_ex` | `packages/dbgpt-core/src/dbgpt/datasource/rdbms/base.py` | Datasource | Not wired | Provide low-level interception hook or read-only enforcement |
| ConnectorManager callers | `packages/dbgpt-serve/src/dbgpt_serve/datasource` | Datasource | Not fully inventoried | Enumerate direct connector access and wrap privileged calls |
| Internal metadata/health tasks | `packages/dbgpt-serve/src/dbgpt_serve/governance/service.py` | Governance | Partially wired | Separate connector health checks from user SQL authorization |

No-Go for enforce mode: any row above marked `Not wired` without a compensating
feature flag or explicit closure.
