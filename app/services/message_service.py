from datetime import UTC, datetime
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.models.assignment import MessageAssignment
from app.models.attachment import MessageAttachment
from app.models.enums import AssignmentStatus
from app.models.message import TeamsMessage
from app.models.user import User
from app.schemas.message import AssignmentStatusUpdate, MessageCreate

def create_message_with_tracking(db: Session, payload: MessageCreate) -> TeamsMessage:
    if payload.teams_message_id and payload.team_id and payload.channel_id:
        existing = db.scalar(
            select(TeamsMessage).where(
                TeamsMessage.team_id == payload.team_id,
                TeamsMessage.channel_id == payload.channel_id,
                TeamsMessage.teams_message_id == payload.teams_message_id,
            )
        )
        if existing:
            return get_message(db, existing.id)

    message = TeamsMessage(
        source=payload.source,
        team_id=payload.team_id,
        team_name=payload.team_name,
        channel_id=payload.channel_id,
        channel_name=payload.channel_name,
        thread_id=payload.thread_id,
        teams_message_id=payload.teams_message_id,
        subject=payload.subject,
        body_text=payload.body_text,
        sender_name=payload.sender_name,
        sender_email=str(payload.sender_email) if payload.sender_email else None,
        sent_at=payload.sent_at,
    )
    db.add(message)
    db.flush()

    for item in payload.attachments:
        db.add(MessageAttachment(message_id=message.id, **item.model_dump()))

    assignee_emails = {str(item.assignee_email).lower(): item for item in payload.assignments}
    if assignee_emails:
        users = db.scalars(select(User).where(User.email.in_(assignee_emails.keys()))).all()
        found_emails = {user.email.lower() for user in users}
        missing = sorted(set(assignee_emails) - found_emails)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Assignee belum ada di master user: {', '.join(missing)}",
            )

        now = datetime.now(UTC)
        for user in users:
            assignment_input = assignee_emails[user.email.lower()]
            db.add(
                MessageAssignment(
                    message_id=message.id,
                    assignee_id=user.id,
                    assigned_by=payload.sender_name,
                    status=AssignmentStatus.DELIVERED,
                    delivered_at=now,
                    due_at=assignment_input.due_at,
                    notes=assignment_input.notes,
                )
            )

    db.commit()
    return get_message(db, message.id)

def get_message(db: Session, message_id: int) -> TeamsMessage:
    message = db.scalar(
        select(TeamsMessage)
        .where(TeamsMessage.id == message_id)
        .options(
            selectinload(TeamsMessage.attachments),
            selectinload(TeamsMessage.assignments).selectinload(MessageAssignment.assignee),
        )
    )
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message tidak ditemukan")
    return message

def update_assignment_status(
    db: Session, assignment_id: int, payload: AssignmentStatusUpdate
) -> MessageAssignment:
    assignment = db.scalar(
        select(MessageAssignment)
        .where(MessageAssignment.id == assignment_id)
        .options(selectinload(MessageAssignment.assignee))
    )
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment tidak ditemukan")

    now = datetime.now(UTC)
    assignment.status = payload.status
    if payload.notes is not None:
        assignment.notes = payload.notes
    if payload.status == AssignmentStatus.READ and assignment.read_at is None:
        assignment.read_at = now
    if payload.status == AssignmentStatus.REVIEWED and assignment.reviewed_at is None:
        assignment.reviewed_at = now
    if payload.status in {AssignmentStatus.APPROVED, AssignmentStatus.REJECTED}:
        assignment.completed_at = now

    db.commit()
    db.refresh(assignment)
    return assignment