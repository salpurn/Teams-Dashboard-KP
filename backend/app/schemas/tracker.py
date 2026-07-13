from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import (
    DocumentStatus,
    FunnelPhase,
    FunnelStepCode,
    NotificationStatus,
    ProjectStatus,
    ReviewDecision,
    UserRole,
)

class FunnelStepInfo(BaseModel):
    """Katalog step funnel (hardcode, dari app.core.funnel) - read-only, bukan CRUD."""

    code: FunnelStepCode
    name: str
    phase: FunnelPhase
    sequence: int
    responsibleRoles: list[UserRole]
    isCancellationGate: bool

class FunnelPhaseInfo(BaseModel):
    phase: FunnelPhase
    name: str
    description: str
    steps: list[FunnelStepInfo]

class ProjectDocumentCreate(BaseModel):
    """Metadata attachment mentah dari Teams/SharePoint (dipakai internal saat intake webhook,
    bukan bagian dari kontrak FE)."""

    document_id: str | None = None
    file_name: str
    content_type: str | None = None
    web_url: str | None = None
    preview_url: str | None = None
    step_code: FunnelStepCode | None = None
    is_primary: bool = False

class ProjectCreate(BaseModel):
    title: str
    client_name: str
    contract_value: Decimal | None = None
    account_manager_email: EmailStr
    bud_officer_email: EmailStr | None = None
    sda_officer_email: EmailStr | None = None
    legal_officer_email: EmailStr | None = None
    source_message_id: int | None = None
    notes: str | None = None
    documents: list[ProjectDocumentCreate] = Field(default_factory=list)

class FeCustodian(BaseModel):
    name: str
    role: str
    dept: str | None
    email: str
    avatar: str  # placeholder ui-avatars.com dari inisial nama - backend tidak simpan foto asli
    roleCode: UserRole  # AM/BUD/SDA/LEGAL/MANAGER - dipakai FE buat permission check


class FeDocument(BaseModel):
    """Satu step funnel = satu entri `documents[]` di frontend (code/name/status/updatedBy/date)."""

    code: FunnelStepCode
    name: str
    status: DocumentStatus
    updatedBy: str | None
    date: str
    isLocked: bool
    responsibleRoles: list[UserRole]


class FeHistoryEntry(BaseModel):
    timestamp: datetime
    user: str
    role: str
    action: str
    notes: str | None


class FeProject(BaseModel):
    """Bentuk project persis seperti objek `projects[]` di frontend, sumber data backend."""

    id: str
    name: str
    client: str
    am: str
    value: float
    currentPhase: FunnelPhase
    currentStep: FunnelStepCode | None
    status: ProjectStatus
    lastUpdated: datetime
    slaLimitHours: int
    slaState: str
    idleHours: int
    custodian: FeCustodian | None
    documents: list[FeDocument]
    history: list[FeHistoryEntry]


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
    project_step_id: int | None
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


class AvailableFileSchema(BaseModel):
    id: int
    name: str
    size: str
    date: str
    file_type: str
    source: str
    category: str

    model_config = ConfigDict(from_attributes=True)
