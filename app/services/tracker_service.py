import re
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.audit import AuditEvent
from app.models.enums import ProjectStatus, ReviewDecision, ReviewTaskStatus
from app.models.message import TeamsMessage
from app.models.notification import DeviceToken, Notification
from app.models.project import Project, ProjectDocument
from app.models.review_level import ReviewLevel
from app.models.review_task import ReviewTask
from app.models.setting import SystemSetting
from app.models.user import User
from app.schemas.tracker import (
    DeviceTokenCreate,
    ProjectCreate,
    ReviewDecisionCreate,
    ReviewLevelCreate,
    ReviewLevelUpdate,
    SlaSetting,
    TestPushNotificationCreate,
)
from app.services.push_service import send_push_notification

DEFAULT_SLA_HOURS = 48
WARNING_SLA_HOURS = 24
APPROVE_KEYWORDS = ("oke", "ok", "approve", "approved", "setuju", "sudah review")
REJECT_KEYWORDS = ("reject", "rejected", "tolak", "ditolak")
RETURN_KEYWORDS = ("return", "returned", "kembalikan", "revisi")


def get_user_by_email(db: Session, email: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if not user:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"User belum terdaftar: {email}")
    return user


def get_sla_settings(db: Session) -> SlaSetting:
    values = {
        row.key: row.value
        for row in db.scalars(
            select(SystemSetting).where(SystemSetting.key.in_(["default_sla_hours", "warning_sla_hours"]))
        )
    }
    return SlaSetting(
        default_sla_hours=int(values.get("default_sla_hours", DEFAULT_SLA_HOURS)),
        warning_sla_hours=int(values.get("warning_sla_hours", WARNING_SLA_HOURS)),
    )


def set_sla_settings(db: Session, payload: SlaSetting) -> SlaSetting:
    for key, value, description in [
        ("default_sla_hours", payload.default_sla_hours, "Tenggat global dokumen idle di level manager."),
        ("warning_sla_hours", payload.warning_sla_hours, "Ambang warna kuning sebelum overdue."),
    ]:
        setting = db.get(SystemSetting, key)
        if setting:
            setting.value = str(value)
        else:
            db.add(SystemSetting(key=key, value=str(value), description=description))
    db.commit()
    return get_sla_settings(db)


def create_or_update_review_level(
    db: Session, payload: ReviewLevelCreate | ReviewLevelUpdate, level_id: int | None = None
) -> ReviewLevel:
    manager = None
    if payload.default_manager_email:
        manager = get_user_by_email(db, str(payload.default_manager_email))

    if level_id is None:
        data = payload.model_dump(exclude={"default_manager_email"})
        level = ReviewLevel(**data, default_manager_id=manager.id if manager else None)
        db.add(level)
    else:
        level = db.get(ReviewLevel, level_id)
        if not level:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Level review tidak ditemukan")
        for key, value in payload.model_dump(exclude={"default_manager_email"}, exclude_unset=True).items():
            setattr(level, key, value)
        if "default_manager_email" in payload.model_fields_set:
            level.default_manager_id = manager.id if manager else None

    db.commit()
    db.refresh(level)
    return level


def create_project(db: Session, payload: ProjectCreate) -> Project:
    account_manager = get_user_by_email(db, str(payload.account_manager_email))
    initial_level = _get_initial_level(db, payload.initial_level_code)
    manager = initial_level.default_manager
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Level {initial_level.code} belum punya manager penanggung jawab",
        )

    project = Project(
        project_code=_next_project_code(db),
        title=payload.title,
        client_name=payload.client_name,
        contract_value=payload.contract_value,
        account_manager_id=account_manager.id,
        current_level_id=initial_level.id,
        status=ProjectStatus.WAITING_REVIEW,
        source_message_id=payload.source_message_id,
        notes=payload.notes,
    )
    db.add(project)
    db.flush()

    for document in payload.documents:
        db.add(ProjectDocument(project_id=project.id, **document.model_dump()))

    task = _open_review_task(db, project, initial_level, manager, payload.source_message_id)
    project.current_task_id = task.id
    _audit(db, project.id, account_manager.id, task.id, "create_project", "Create Project", "Project dibuat.")
    _notify(
        db,
        manager.id,
        project.id,
        task.id,
        "new_review_task",
        "Dokumen baru perlu direview",
        f"{project.project_code} - {project.title} masuk ke level {initial_level.code}.",
    )
    db.commit()
    return get_project(db, project.id)


def get_project(db: Session, project_id: int) -> Project:
    project = db.scalar(
        select(Project)
        .where(Project.id == project_id)
        .options(
            selectinload(Project.account_manager),
            selectinload(Project.current_level).selectinload(ReviewLevel.default_manager),
            selectinload(Project.current_task).selectinload(ReviewTask.level).selectinload(ReviewLevel.default_manager),
            selectinload(Project.current_task).selectinload(ReviewTask.manager),
            selectinload(Project.documents),
            selectinload(Project.review_tasks).selectinload(ReviewTask.level).selectinload(ReviewLevel.default_manager),
            selectinload(Project.review_tasks).selectinload(ReviewTask.manager),
            selectinload(Project.audit_events).selectinload(AuditEvent.actor),
        )
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project tidak ditemukan")
    return project


def submit_review_decision(db: Session, project_id: int, payload: ReviewDecisionCreate) -> Project:
    project = get_project(db, project_id)
    actor = get_user_by_email(db, str(payload.actor_email))
    task = project.current_task
    if not task:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project tidak punya task aktif")
    if task.manager_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hanya manager level aktif yang bisa review")
    if task.status in {ReviewTaskStatus.APPROVED, ReviewTaskStatus.REJECTED, ReviewTaskStatus.RETURNED}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task review sudah selesai")

    now = datetime.now(UTC)
    task.decision = payload.decision
    task.response_text = payload.response_text
    task.notes = payload.notes
    task.decided_at = now

    if payload.decision == ReviewDecision.APPROVE:
        task.status = ReviewTaskStatus.APPROVED
        _audit(db, project.id, actor.id, task.id, "review_approved", "Review Approved", payload.response_text)
        next_level = _next_level(db, task.level.sequence)
        if next_level:
            next_manager = next_level.default_manager
            if not next_manager:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Level {next_level.code} belum punya manager penanggung jawab",
                )
            next_task = _open_review_task(db, project, next_level, next_manager, None)
            project.current_level_id = next_level.id
            project.current_task_id = next_task.id
            project.status = ProjectStatus.WAITING_REVIEW
            _notify(
                db,
                next_manager.id,
                project.id,
                next_task.id,
                "new_review_task",
                "Dokumen perlu review level berikutnya",
                f"{project.project_code} lanjut ke level {next_level.code} - {next_level.name}.",
            )
        else:
            project.status = ProjectStatus.COMPLETED
            project.current_task_id = task.id
            _notify(
                db,
                project.account_manager_id,
                project.id,
                task.id,
                "project_completed",
                "Dokumen selesai",
                f"{project.project_code} sudah selesai di semua level review.",
            )
    elif payload.decision == ReviewDecision.REJECT:
        task.status = ReviewTaskStatus.REJECTED
        project.status = ProjectStatus.REJECTED
        _audit(db, project.id, actor.id, task.id, "review_rejected", "Review Rejected", payload.response_text)
        _notify(db, project.account_manager_id, project.id, task.id, "project_rejected", "Dokumen ditolak", payload.response_text)
    else:
        task.status = ReviewTaskStatus.RETURNED
        project.status = ProjectStatus.RETURNED
        _audit(db, project.id, actor.id, task.id, "review_returned", "Review Returned", payload.response_text)
        _notify(
            db,
            project.account_manager_id,
            project.id,
            task.id,
            "project_returned",
            "Dokumen dikembalikan untuk revisi",
            payload.response_text,
        )

    db.commit()
    return get_project(db, project.id)


def mark_overdue_tasks(db: Session) -> list[Notification]:
    now = datetime.now(UTC)
    tasks = db.scalars(
        select(ReviewTask)
        .where(
            ReviewTask.status.in_([ReviewTaskStatus.WAITING, ReviewTaskStatus.IN_REVIEW]),
            ReviewTask.due_at.is_not(None),
            ReviewTask.due_at < now,
            ReviewTask.overdue_notified_at.is_(None),
        )
        .options(selectinload(ReviewTask.project), selectinload(ReviewTask.level), selectinload(ReviewTask.manager))
    ).all()

    notifications = []
    for task in tasks:
        task.overdue_notified_at = now
        notification = _notify(
            db,
            task.manager_id,
            task.project_id,
            task.id,
            "review_overdue",
            "Dokumen melewati SLA",
            f"{task.project.project_code} tertahan di {task.level.code} - {task.level.name}.",
        )
        _audit(db, task.project_id, None, task.id, "sla_overdue", "SLA Overdue", "Dokumen idle melewati tenggat.")
        notifications.append(notification)
    db.commit()
    return notifications


def register_device_token(db: Session, payload: DeviceTokenCreate) -> DeviceToken:
    user = get_user_by_email(db, str(payload.user_email))
    token = db.scalar(select(DeviceToken).where(DeviceToken.token == payload.token))
    if token:
        token.user_id = user.id
        token.platform = payload.platform
        token.is_active = True
    else:
        token = DeviceToken(user_id=user.id, token=payload.token, platform=payload.platform)
        db.add(token)
    db.commit()
    db.refresh(token)
    return token


def create_test_notification(db: Session, payload: TestPushNotificationCreate) -> Notification:
    user = get_user_by_email(db, str(payload.user_email))
    notification = _notify(
        db,
        user.id,
        None,
        None,
        "manual_test_push",
        payload.title,
        payload.body,
        push_data=payload.data,
    )
    db.commit()
    db.refresh(notification)
    return notification


def process_message_for_tracker(db: Session, message: TeamsMessage) -> Project | None:
    if message.attachments:
        return _create_project_from_message(db, message)
    return _apply_review_response_from_message(db, message)


def _create_project_from_message(db: Session, message: TeamsMessage) -> Project | None:
    existing = db.scalar(select(Project).where(Project.source_message_id == message.id))
    if existing:
        return get_project(db, existing.id)

    attachment_document_ids = [item.external_id for item in message.attachments if item.external_id]
    if attachment_document_ids:
        project_id = db.scalar(
            select(Project.id)
            .join(Project.documents)
            .where(ProjectDocument.document_id.in_(attachment_document_ids))
            .limit(1)
        )
        if project_id:
            return get_project(db, project_id)

    sender_email = (message.sender_email or "").lower()
    if not sender_email:
        return None

    sender_exists = db.scalar(select(User.id).where(User.email == sender_email))
    if not sender_exists:
        return None

    title = (message.subject or "").strip() or f"Dokumen {message.id}"
    payload = ProjectCreate(
        title=title,
        client_name=_infer_client_name(message),
        contract_value=None,
        account_manager_email=sender_email,
        source_message_id=message.id,
        notes=f"Dibuat otomatis dari Teams message {message.teams_message_id or message.id}.",
        documents=[
            {
                "document_id": item.external_id,
                "file_name": item.file_name,
                "content_type": item.content_type,
                "web_url": item.web_url,
                "preview_url": item.preview_url,
                "is_primary": index == 0,
            }
            for index, item in enumerate(message.attachments)
        ],
    )
    return create_project(db, payload)


def _apply_review_response_from_message(db: Session, message: TeamsMessage) -> Project | None:
    sender_email = (message.sender_email or "").lower()
    if not sender_email or not message.thread_id:
        return None

    project = db.scalar(
        select(Project)
        .join(Project.source_message)
        .where(
            or_(
                TeamsMessage.thread_id == message.thread_id,
                TeamsMessage.teams_message_id == message.thread_id,
            ),
            Project.status.in_([ProjectStatus.WAITING_REVIEW, ProjectStatus.ACTIVE]),
        )
        .order_by(Project.updated_at.desc())
    )
    if not project:
        return None

    current = project.current_task
    if not current:
        return None
    if current.status not in {ReviewTaskStatus.WAITING, ReviewTaskStatus.IN_REVIEW}:
        return None
    if not current.manager or current.manager.email.lower() != sender_email:
        return None

    decision = _infer_decision(message.subject, message.body_text)
    if decision is None:
        return None

    return submit_review_decision(
        db,
        project.id,
        ReviewDecisionCreate(
            decision=decision,
            actor_email=sender_email,
            response_text=(message.body_text or "").strip() or "oke, sudah review",
            notes=f"Auto-captured dari balasan Teams message {message.teams_message_id or message.id}.",
        ),
    )


def _next_project_code(db: Session) -> str:
    year = datetime.now().year
    count = db.scalar(select(func.count(Project.id)).where(Project.project_code.like(f"PRJ-{year}-%"))) or 0
    return f"PRJ-{year}-{count + 1:03d}"


def _get_initial_level(db: Session, code: str | None) -> ReviewLevel:
    statement = select(ReviewLevel).where(ReviewLevel.is_active.is_(True))
    if code:
        statement = statement.where(ReviewLevel.code == code)
    else:
        statement = statement.order_by(ReviewLevel.sequence)
    level = db.scalar(statement)
    if not level:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Level awal belum tersedia")
    return level


def _next_level(db: Session, current_sequence: int) -> ReviewLevel | None:
    return db.scalar(
        select(ReviewLevel)
        .where(ReviewLevel.is_active.is_(True), ReviewLevel.sequence > current_sequence)
        .order_by(ReviewLevel.sequence)
        .limit(1)
    )


def _open_review_task(
    db: Session,
    project: Project,
    level: ReviewLevel,
    manager: User,
    source_message_id: int | None,
) -> ReviewTask:
    sla = get_sla_settings(db)
    due_hours = level.sla_hours or sla.default_sla_hours
    now = datetime.now(UTC)
    task = ReviewTask(
        project_id=project.id,
        level_id=level.id,
        manager_id=manager.id,
        status=ReviewTaskStatus.WAITING,
        due_at=now + timedelta(hours=due_hours),
        first_notified_at=now,
        created_from_message_id=source_message_id,
    )
    db.add(task)
    db.flush()
    _audit(
        db,
        project.id,
        None,
        task.id,
        "level_assigned",
        "Level Assigned",
        f"Dokumen masuk ke {level.code} dan ditugaskan ke {manager.display_name}.",
    )
    return task


def _audit(
    db: Session,
    project_id: int,
    actor_id: int | None,
    review_task_id: int | None,
    event_type: str,
    title: str,
    description: str | None,
) -> AuditEvent:
    event = AuditEvent(
        project_id=project_id,
        actor_id=actor_id,
        review_task_id=review_task_id,
        event_type=event_type,
        title=title,
        description=description,
    )
    db.add(event)
    return event


def _notify(
    db: Session,
    user_id: int,
    project_id: int | None,
    review_task_id: int | None,
    notification_type: str,
    title: str,
    body: str,
    push_data: dict[str, str] | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        project_id=project_id,
        review_task_id=review_task_id,
        type=notification_type,
        title=title,
        body=body,
    )
    db.add(notification)
    db.flush()
    payload = dict(push_data or {})
    payload.update(
        {
            "notification_id": str(notification.id),
            "type": notification_type,
        }
    )
    if project_id is not None:
        payload["project_id"] = str(project_id)
    if review_task_id is not None:
        payload["review_task_id"] = str(review_task_id)
    notification.push_status = send_push_notification(
        db=db,
        user_id=user_id,
        title=title,
        body=body,
        data=payload,
    )
    return notification


def _infer_client_name(message: TeamsMessage) -> str:
    subject = (message.subject or "").strip()
    if "-" in subject:
        parts = [part.strip() for part in subject.split("-") if part.strip()]
        if len(parts) > 1:
            return parts[-1]
    return "Unknown Client"


def _infer_decision(subject: str | None, body_text: str | None) -> ReviewDecision | None:
    normalized = _normalize_text(f"{subject or ''} {body_text or ''}")
    if any(keyword in normalized for keyword in REJECT_KEYWORDS):
        return ReviewDecision.REJECT
    if any(keyword in normalized for keyword in RETURN_KEYWORDS):
        return ReviewDecision.RETURN
    if any(keyword in normalized for keyword in APPROVE_KEYWORDS):
        return ReviewDecision.APPROVE
    return None


def _normalize_text(value: str) -> str:
    no_tags = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", no_tags).strip().lower()
