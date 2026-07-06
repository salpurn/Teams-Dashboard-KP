from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import NotificationStatus, ProjectStatus, ReviewDecision, ReviewTaskStatus
from app.schemas.user import UserRead


class ReviewLevelCreate(BaseModel):
    code: str
    name: str
    sequence: int
    description: str | None = None
    default_manager_email: EmailStr | None = None
    sla_hours: int | None = Field(default=None, ge=1)
    is_active: bool = True


class ReviewLevelUpdate(BaseModel):
    name: str | None = None
    sequence: int | None = None
    description: str | None = None
    default_manager_email: EmailStr | None = None
    sla_hours: int | None = Field(default=None, ge=1)
    is_active: bool | None = None


class ReviewLevelRead(BaseModel):
    id: int
    code: str
    name: str
    description: str | None
    sequence: int
    sla_hours: int | None
    is_active: bool
    default_manager: UserRead | None

    model_config = ConfigDict(from_attributes=True)


class ProjectDocumentCreate(BaseModel):
    document_id: str | None = None
    file_name: str
    content_type: str | None = None
    web_url: str | None = None
    preview_url: str | None = None
    is_primary: bool = False


class ProjectDocumentRead(ProjectDocumentCreate):
    id: int
    project_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectCreate(BaseModel):
    title: str
    client_name: str
    contract_value: Decimal | None = None
    account_manager_email: EmailStr
    initial_level_code: str | None = "F2"
    source_message_id: int | None = None
    notes: str | None = None
    documents: list[ProjectDocumentCreate] = Field(default_factory=list)


class ProjectListItem(BaseModel):
    id: int
    project_code: str
    title: str
    client_name: str
    contract_value: Decimal | None
    status: ProjectStatus
    current_level_code: str | None
    current_level_name: str | None
    current_manager_name: str | None
    due_at: datetime | None
    sla_state: str
    idle_hours: int


class ReviewTaskRead(BaseModel):
    id: int
    project_id: int
    status: ReviewTaskStatus
    decision: ReviewDecision | None
    response_text: str | None
    notes: str | None
    started_at: datetime
    due_at: datetime | None
    first_notified_at: datetime | None
    overdue_notified_at: datetime | None
    decided_at: datetime | None
    level: ReviewLevelRead
    manager: UserRead

    model_config = ConfigDict(from_attributes=True)


class AuditEventRead(BaseModel):
    id: int
    event_type: str
    title: str
    description: str | None
    created_at: datetime
    actor: UserRead | None

    model_config = ConfigDict(from_attributes=True)


class ProjectRead(BaseModel):
    id: int
    project_code: str
    title: str
    client_name: str
    contract_value: Decimal | None
    status: ProjectStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime
    account_manager: UserRead
    current_level: ReviewLevelRead | None
    current_task: ReviewTaskRead | None
    documents: list[ProjectDocumentRead]
    review_tasks: list[ReviewTaskRead]
    audit_events: list[AuditEventRead]

    model_config = ConfigDict(from_attributes=True)


class ReviewDecisionCreate(BaseModel):
    decision: ReviewDecision
    actor_email: EmailStr
    response_text: str = "oke, sudah review"
    notes: str | None = None


class SlaSetting(BaseModel):
    default_sla_hours: int = Field(ge=1)
    warning_sla_hours: int = Field(default=24, ge=1)


class NotificationRead(BaseModel):
    id: int
    user_id: int
    project_id: int | None
    review_task_id: int | None
    type: str
    title: str
    body: str
    status: NotificationStatus
    push_status: NotificationStatus | None
    read_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeviceTokenCreate(BaseModel):
    user_email: EmailStr
    token: str
    platform: str | None = None


class TestPushNotificationCreate(BaseModel):
    user_email: EmailStr
    title: str = Field(min_length=1, max_length=180)
    body: str = Field(min_length=1, max_length=1000)
    data: dict[str, str] = Field(default_factory=dict)
