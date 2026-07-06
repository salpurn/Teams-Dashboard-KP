from fastapi import APIRouter, Depends, Query
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.assignment import MessageAssignment
from app.models.attachment import MessageAttachment
from app.models.enums import AssignmentStatus
from app.models.message import TeamsMessage
from app.models.user import User
from app.schemas.message import (
    AssignmentRead,
    AssignmentStatusUpdate,
    MessageListItem,
    MessageRead,
)
from app.services.message_service import (
    get_message,
    update_assignment_status,
)

router = APIRouter()


@router.get("", response_model=list[MessageListItem])
def list_messages(
    channel_id: str | None = None,
    assignee_email: str | None = None,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[MessageListItem]:
    attachment_count = (
        select(func.count())
        .select_from(MessageAttachment)
        .where(MessageAttachment.message_id == TeamsMessage.id)
        .scalar_subquery()
    )
    assignment_count = (
        select(func.count())
        .select_from(MessageAssignment)
        .where(MessageAssignment.message_id == TeamsMessage.id)
        .scalar_subquery()
    )
    pending_count = (
        select(func.count())
        .select_from(MessageAssignment)
        .where(
            MessageAssignment.message_id == TeamsMessage.id,
            MessageAssignment.status.in_([AssignmentStatus.PENDING, AssignmentStatus.DELIVERED]),
        )
        .scalar_subquery()
    )

    statement: Select = select(
        TeamsMessage.id,
        TeamsMessage.subject,
        TeamsMessage.channel_name,
        TeamsMessage.sender_name,
        TeamsMessage.sent_at,
        TeamsMessage.created_at,
        attachment_count.label("attachment_count"),
        assignment_count.label("assignment_count"),
        pending_count.label("pending_count"),
    ).order_by(TeamsMessage.sent_at.desc().nullslast(), TeamsMessage.created_at.desc())

    if channel_id:
        statement = statement.where(TeamsMessage.channel_id == channel_id)
    if assignee_email:
        statement = statement.join(TeamsMessage.assignments).join(MessageAssignment.assignee).where(
            User.email == assignee_email.lower()
        )

    rows = db.execute(statement.limit(limit).offset(offset)).all()
    return [MessageListItem.model_validate(row._mapping) for row in rows]

@router.get("/{message_id}", response_model=MessageRead)
def read_message(message_id: int, db: Session = Depends(get_db)) -> TeamsMessage:
    return get_message(db, message_id)


@router.patch("/assignments/{assignment_id}", response_model=AssignmentRead)
def patch_assignment_status(
    assignment_id: int,
    payload: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
) -> MessageAssignment:
    return update_assignment_status(db, assignment_id, payload)
