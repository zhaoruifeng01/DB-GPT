# ADR: DB-GPT Governance Integration Boundary

Date: 2026-07-16

## Status

Accepted for the first governance hardening slice.

## Decision

DB-GPT governance integrates as native DB-GPT serve modules. The only identity
source is `sys_user`, `sys_role`, and `sys_dept`. The only datasource source of
truth is `connect_config`. The only runtime connector entry is
`ConnectorManager`.

## Keep

- Permission Serve user, role, and department tables.
- `ConnectConfigEntity`, Datasource Serve, and `ConnectorManager`.
- DB-GPT metadata storage and Alembic migration flow.
- DB-GPT tracer and metrics infrastructure.

## Rewrite

- Governance authorization as a structured Authorizer, not role-code string
  matching in route code.
- SQL Guard as a bounded parser-based validator with default deny behavior.
- Audit events as whitelisted structured records with SQL fingerprints and
  redacted templates.
- Metadata scanning through DB-GPT connectors and repositories.

## Exclude

- SQL Lab, generic SQL editor, AI SQL, Jinja SQL, Resource-as-API, product
  catalog expansion, and row-level ABAC.
- Yunshu `api_users`, passwords, tokens, API keys, datasource master tables,
  connector pools, database adapters, portal middleware, and standalone FastAPI
  application.

## Consequences

- Governance startup must not create tables. Alembic is the only schema path.
- `/governance/query` and Governance API key creation stay disabled by default
  until SQL Guard, Authorizer, masking, and audit are complete.
- Any SQL execution entry not wired to the unified flow must be explicitly
  tracked and kept closed for governance enforce mode.
