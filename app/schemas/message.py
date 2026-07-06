from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.enums import AssignmentStatus, AttachmentKind, MessageSource
from app.schemas.user import UserRead

class AttachmentCreate(BaseModel):
    external_id: str | None = None
    file_name: str
    content_type: str | None = None
    kind: AttachmentKind = AttachmentKind.DOCUMENT
    web_url: str | None = None
    preview_url: str | None = None

class AttachmentRead(AttachmentCreate):
    id: int
    message_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AssignmentCreate(BaseModel):
    assignee_email: EmailStr
    due_at: datetime | None = None
    notes: str | None = None

class AssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus
    notes: str | None = None

class AssignmentRead(BaseModel):
    id: int
    message_id: int
    status: AssignmentStatus
    assigned_by: str | None
    assigned_at: datetime
    delivered_at: datetime | None
    read_at: datetime | None
    reviewed_at: datetime | None
    completed_at: datetime | None
    due_at: datetime | None
    notes: str | None
    assignee: UserRead
    model_config = ConfigDict(from_attributes=True)

class MessageCreate(BaseModel):
    source: MessageSource = MessageSource.MANUAL
    team_id: str | None = None
    team_name: str | None = None
    channel_id: str | None = None
    channel_name: str | None = None
    thread_id: str | None = None
    teams_message_id: str | None = None
    subject: str | None = None
    body_text: str
    sender_name: str | None = None
    sender_email: EmailStr | None = None
    sent_at: datetime | None = None
    attachments: list[AttachmentCreate] = Field(default_factory=list)
    assignments: list[AssignmentCreate] = Field(default_factory=list)

class MessageRead(BaseModel):
    id: int
    source: MessageSource
    team_id: str | None
    team_name: str | None
    channel_id: str | None
    channel_name: str | None
    thread_id: str | None
    teams_message_id: str | None
    subject: str | None
    body_text: str
    sender_name: str | None
    sender_email: str | None
    sent_at: datetime | None
    created_at: datetime
    updated_at: datetime
    attachments: list[AttachmentRead]
    assignments: list[AssignmentRead]
    model_config = ConfigDict(from_attributes=True)

class MessageListItem(BaseModel):
    id: int
    subject: str | None
    channel_name: str | None
    sender_name: str | None
    sent_at: datetime | None
    created_at: datetime
    attachment_count: int
    assignment_count: int
    pending_count: int

class GraphNotification(BaseModel):
    subscriptionId: str | None = None
    clientState: str | None = None
    changeType: str | None = None
    resource: str | None = None
    resourceData: dict | None = None
    tenantId: str | None = None