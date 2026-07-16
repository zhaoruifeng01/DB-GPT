"""Request models for governance APIs."""

from typing import Optional

from dbgpt._private.pydantic import BaseModel, Field


class DatasourcePolicyRequest(BaseModel):
    status: str = Field(default="enabled")
    business_domain: Optional[str] = None
    description: Optional[str] = None
    owner_user_id: Optional[int] = None


class RoleGrantRequest(BaseModel):
    role_code: str
    datasource_id: int
    table_pattern: str = "*"
    permission: str = "query"
    allowed_columns: Optional[str] = None


class MaskRuleRequest(BaseModel):
    datasource_id: int
    table_name: str = "*"
    column_name: str
    role_code: Optional[str] = None
    mask_type: str = "partial"


class QueryRequest(BaseModel):
    datasource_id: int
    sql: str


class CatalogProductRequest(BaseModel):
    product_key: str
    datasource_id: int
    title: str
    description: Optional[str] = None
    resource_type: str = "table"
    resource_definition: Optional[str] = None
    status: str = "draft"
    rate_limit_per_minute: int = 60


class AccessRequestCreate(BaseModel):
    reason: Optional[str] = None


class AccessRequestReview(BaseModel):
    status: str = Field(description="approved or rejected")
    review_comment: Optional[str] = None


class ApiKeyCreateRequest(BaseModel):
    name: str
    expires_at: Optional[str] = None
