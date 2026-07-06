import re
from datetime import UTC, datetime, timedelta
from urllib.parse import quote_plus

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.funnel import (
    FUNNEL_STEP_BY_CODE,
    FUNNEL_STEP_ORDER,
    FIRST_STEP,
    WARNING_SLA_HOURS as CATALOG_WARNING_SLA_HOURS,
    DEFAULT_SLA_HOURS as CATALOG_DEFAULT_SLA_HOURS,
    can_role_act_on_step,
    is_future_step,
    next_step,
    primary_role_for_step,
)
from app.models.audit import AuditEvent
from app.models.enums import DocumentStatus, FunnelStepCode, ProjectStatus, ReviewDecision, UserRole
from app.models.message import TeamsMessage
from app.models.notification import DeviceToken, Notification
from app.models.project import Project, ProjectDocument
from app.models.project_step import ProjectStep
from app.models.setting import SystemSetting
from app.models.user import User
from app.schemas.tracker import (
    DeviceTokenCreate,
    FeCustodian,
    FeDocument,
    FeHistoryEntry,
    FeProject,
    ProjectCreate,
    ReviewDecisionCreate,
    SlaSetting,
    TestPushNotificationCreate,
)
from app.services.push_service import send_push_notification

DEFAULT_SLA_HOURS = CATALOG_DEFAULT_SLA_HOURS
WARNING_SLA_HOURS = CATALOG_WARNING_SLA_HOURS
APPROVE_KEYWORDS = ("oke", "ok", "approve", "approved", "setuju", "sudah review")
REJECT_KEYWORDS = ("reject", "rejected", "tolak", "ditolak")
RETURN_KEYWORDS = ("return", "returned", "kembalikan", "revisi")

_ROLE_FIELD = {
    UserRole.AM: "account_manager_id",
    UserRole.BUD: "bud_officer_id",
    UserRole.SDA: "sda_officer_id",
    UserRole.LEGAL: "legal_officer_id",
}


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
        ("default_sla_hours", payload.default_sla_hours, "Tenggat global dokumen idle di step aktif."),
        ("warning_sla_hours", payload.warning_sla_hours, "Ambang warna kuning sebelum overdue."),
    ]:
        setting = db.get(SystemSetting, key)
        if setting:
            setting.value = str(value)
        else:
            db.add(SystemSetting(key=key, value=str(value), description=description))
    db.commit()
    return get_sla_settings(db)


def _officer_id_for_role(project: Project, role: UserRole) -> int | None:
    field = _ROLE_FIELD.get(role)
    return getattr(project, field) if field else None


def create_project(db: Session, payload: ProjectCreate) -> FeProject:
    account_manager = get_user_by_email(db, str(payload.account_manager_email))
    bud_officer = get_user_by_email(db, str(payload.bud_officer_email)) if payload.bud_officer_email else None
    sda_officer = get_user_by_email(db, str(payload.sda_officer_email)) if payload.sda_officer_email else None
    legal_officer = get_user_by_email(db, str(payload.legal_officer_email)) if payload.legal_officer_email else None

    sla = get_sla_settings(db)
    first_step_def = FUNNEL_STEP_BY_CODE[FIRST_STEP]
    project = Project(
        project_code=_next_project_code(db),
        title=payload.title,
        client_name=payload.client_name,
        contract_value=payload.contract_value,
        account_manager_id=account_manager.id,
        bud_officer_id=bud_officer.id if bud_officer else None,
        sda_officer_id=sda_officer.id if sda_officer else None,
        legal_officer_id=legal_officer.id if legal_officer else None,
        current_phase=first_step_def.phase,
        current_step=FIRST_STEP,
        status=ProjectStatus.ACTIVE,
        sla_limit_hours=sla.default_sla_hours,
        source_message_id=payload.source_message_id,
        notes=payload.notes,
    )
    db.add(project)
    db.flush()

    for document in payload.documents:
        db.add(ProjectDocument(project_id=project.id, **document.model_dump()))

    now = datetime.now(UTC)
    for step_def in FUNNEL_STEP_BY_CODE.values():
        project.steps.append(ProjectStep(step_code=step_def.code, status=DocumentStatus.EMPTY))
    db.flush()

    first_step_row = _activate_step(db, project, FIRST_STEP, now, sla.default_sla_hours)
    custodian_id = first_step_row.custodian_id

    _audit(db, project.id, account_manager.id, first_step_row.id, "create_project", "Create Project", "Project dibuat, masuk fase F2 di step P1.")
    if custodian_id:
        _notify(
            db,
            custodian_id,
            project.id,
            first_step_row.id,
            "new_step_assigned",
            "Dokumen baru perlu diproses",
            f"{project.project_code} - {project.title} masuk ke step {FIRST_STEP.value}.",
        )
    db.commit()
    return get_project(db, project.project_code)


def _fetch_project_orm(db: Session, project_code: str) -> Project:
    project = db.scalar(
        select(Project)
        .where(Project.project_code == project_code)
        .options(
            selectinload(Project.account_manager),
            selectinload(Project.bud_officer),
            selectinload(Project.sda_officer),
            selectinload(Project.legal_officer),
            selectinload(Project.steps).selectinload(ProjectStep.custodian),
            selectinload(Project.audit_events).selectinload(AuditEvent.actor),
        )
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project tidak ditemukan")
    return project


def get_project(db: Session, project_code: str) -> FeProject:
    return serialize_fe_project(db, _fetch_project_orm(db, project_code))


def list_fe_projects(db: Session, projects: list[Project]) -> list[FeProject]:
    return [serialize_fe_project(db, project) for project in projects]


def serialize_fe_project(db: Session, project: Project) -> FeProject:
    sla = get_sla_settings(db)
    step_row = _current_custodian_step(project)
    sla_state, idle_hours = _sla_state_and_idle(project, step_row, sla.warning_sla_hours)
    custodian = _fe_custodian(step_row, project)
    last_updated = (step_row.decided_at or step_row.started_at) if step_row else project.updated_at

    return FeProject(
        id=project.project_code,
        name=project.title,
        client=project.client_name,
        am=project.account_manager.display_name,
        value=float(project.contract_value) if project.contract_value is not None else 0.0,
        currentPhase=project.current_phase,
        currentStep=project.current_step,
        status=project.status,
        lastUpdated=_aware(last_updated),
        slaLimitHours=project.sla_limit_hours,
        slaState=sla_state,
        idleHours=idle_hours,
        custodian=custodian,
        documents=_fe_documents(project),
        history=_fe_history(project),
    )


def _current_custodian_step(project: Project) -> ProjectStep | None:
    """Step yang lagi 'dipegang' seseorang sekarang - dasar `custodian` & `lastUpdated` di FE."""
    if project.current_step is not None and project.current_step in FUNNEL_STEP_BY_CODE:
        row = next((s for s in project.steps if s.step_code == project.current_step), None)
        if row is not None:
            return row
    # Project cancelled (P9) atau belum masuk funnel: pakai step terakhir yang sempat diputuskan.
    decided = [s for s in project.steps if s.decided_at is not None]
    if decided:
        return max(decided, key=lambda s: _aware(s.decided_at))
    return None


def _avatar_url(display_name: str) -> str:
    return f"https://ui-avatars.com/api/?name={quote_plus(display_name)}&background=004b87&color=fff&size=150"


def _fe_custodian(step_row: ProjectStep | None, project: Project) -> FeCustodian | None:
    user = step_row.custodian if step_row and step_row.custodian else project.account_manager
    if user is None:
        return None
    return FeCustodian(
        name=user.display_name,
        role=user.position or user.role.value,
        dept=user.unit,
        email=user.email,
        avatar=_avatar_url(user.display_name),
        roleCode=user.role,
    )


def _sla_state_and_idle(project: Project, step_row: ProjectStep | None, warning_hours: int) -> tuple[str, int]:
    now = datetime.now(UTC)
    if project.status == ProjectStatus.WON:
        return "done", 0
    if project.status == ProjectStatus.CANCELLED:
        return "cancelled", 0
    if step_row is None:
        return "on_track", 0

    idle_hours = int((now - _aware(step_row.started_at)).total_seconds() // 3600)
    if step_row.due_at is None:
        return "on_track", idle_hours

    remaining_hours = (_aware(step_row.due_at) - now).total_seconds() / 3600
    if remaining_hours < 0:
        return "overdue", idle_hours
    if remaining_hours < warning_hours:
        return "warning", idle_hours
    return "on_track", idle_hours


def _fe_documents(project: Project) -> list[FeDocument]:
    steps_by_code = {s.step_code: s for s in project.steps}
    documents: list[FeDocument] = []
    for code in FUNNEL_STEP_ORDER:
        step_def = FUNNEL_STEP_BY_CODE[code]
        row = steps_by_code.get(code)
        documents.append(
            FeDocument(
                code=code,
                name=step_def.name,
                status=row.status if row else DocumentStatus.EMPTY,
                updatedBy=row.updated_by_label if row else None,
                date=row.decided_at.isoformat() if row and row.decided_at else "",
                isLocked=is_future_step(project.current_step, code),
                responsibleRoles=list(step_def.responsible_roles),
            )
        )
    return documents


def _fe_history(project: Project) -> list[FeHistoryEntry]:
    events = sorted(project.audit_events, key=lambda event: event.created_at)
    return [
        FeHistoryEntry(
            timestamp=event.created_at,
            user=event.actor.display_name if event.actor else "System",
            role=(event.actor.position or event.actor.role.value) if event.actor else "System",
            action=event.title,
            notes=event.description,
        )
        for event in events
    ]


def submit_review_decision(db: Session, project_code: str, payload: ReviewDecisionCreate) -> FeProject:
    project = _fetch_project_orm(db, project_code)
    actor = get_user_by_email(db, str(payload.actor_email))

    if project.status != ProjectStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project sudah selesai atau dibatalkan")
    if project.current_step is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project belum masuk funnel dokumen (masih F0/F1)")

    current_step = project.current_step
    step_row = next((s for s in project.steps if s.step_code == current_step), None)
    if step_row is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Step aktif tidak ditemukan")
    if step_row.status not in {DocumentStatus.PENDING, DocumentStatus.REVISION}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Step ini sudah selesai diproses")

    if not can_role_act_on_step(actor.role, current_step):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role {actor.role.value} tidak berwenang memproses step {current_step.value}",
        )
    if step_row.custodian_id is not None and step_row.custodian_id != actor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya kustodian step aktif yang bisa memproses dokumen ini",
        )

    now = datetime.now(UTC)
    step_row.decision = payload.decision
    step_row.notes = payload.notes
    step_row.decided_at = now
    step_row.updated_by_label = f"{actor.display_name} ({actor.role.value})"

    step_def = FUNNEL_STEP_BY_CODE[current_step]

    if payload.decision == ReviewDecision.APPROVE:
        step_row.status = DocumentStatus.APPROVED
        _audit(db, project.id, actor.id, step_row.id, "step_approved", "Step Approved", payload.response_text)

        nxt = next_step(current_step)
        if nxt is None:
            project.status = ProjectStatus.WON
            _notify(
                db,
                project.account_manager_id,
                project.id,
                step_row.id,
                "project_won",
                "Proyek selesai (WIN)",
                f"{project.project_code} sudah rampung sampai BASO.",
            )
        else:
            sla = get_sla_settings(db)
            next_row = _activate_step(db, project, nxt, now, sla.default_sla_hours)
            if next_row.custodian_id:
                _notify(
                    db,
                    next_row.custodian_id,
                    project.id,
                    next_row.id,
                    "new_step_assigned",
                    "Dokumen perlu diproses",
                    f"{project.project_code} lanjut ke step {nxt.value} - {FUNNEL_STEP_BY_CODE[nxt].name}.",
                )
    elif payload.decision == ReviewDecision.REJECT and step_def.is_cancellation_gate:
        # Hanya gerbang GO/NO GO (Project Assessment) & gerbang Nego Pelanggan (SPPBJ) yang
        # membatalkan seluruh project, sesuai diagram alur resmi -> project pindah ke P9.
        step_row.status = DocumentStatus.REJECTED
        project.status = ProjectStatus.CANCELLED
        project.current_step = FunnelStepCode.P9
        _audit(db, project.id, actor.id, step_row.id, "project_cancelled", "Project Cancelled (NO GO)", payload.response_text)
        _notify(
            db,
            project.account_manager_id,
            project.id,
            step_row.id,
            "project_cancelled",
            "Proyek dibatalkan (NO GO)",
            payload.response_text or f"{project.project_code} dibatalkan di step {current_step.value}.",
        )
    else:
        # REJECT di step non-gerbang diperlakukan sama seperti RETURN: butuh revisi, tetap di step yang sama.
        step_row.status = DocumentStatus.REVISION
        _audit(db, project.id, actor.id, step_row.id, "step_returned", "Step Returned for Revision", payload.response_text)
        _notify(
            db,
            project.account_manager_id,
            project.id,
            step_row.id,
            "step_returned",
            "Dokumen perlu direvisi",
            payload.response_text or f"{project.project_code} butuh revisi di step {current_step.value}.",
        )

    db.commit()
    return get_project(db, project.project_code)


def mark_overdue_tasks(db: Session) -> list[Notification]:
    now = datetime.now(UTC)
    steps = db.scalars(
        select(ProjectStep)
        .where(
            ProjectStep.status.in_([DocumentStatus.PENDING, DocumentStatus.REVISION]),
            ProjectStep.due_at.is_not(None),
            ProjectStep.due_at < now,
            ProjectStep.overdue_notified_at.is_(None),
        )
        .options(selectinload(ProjectStep.project), selectinload(ProjectStep.custodian))
    ).all()

    notifications = []
    for step in steps:
        step.overdue_notified_at = now
        step_def = FUNNEL_STEP_BY_CODE[step.step_code]
        notification = _notify(
            db,
            step.custodian_id or step.project.account_manager_id,
            step.project_id,
            step.id,
            "step_overdue",
            "Dokumen melewati SLA",
            f"{step.project.project_code} tertahan di {step.step_code.value} - {step_def.name}.",
        )
        _audit(db, step.project_id, None, step.id, "sla_overdue", "SLA Overdue", "Dokumen idle melewati tenggat.")
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


def process_message_for_tracker(db: Session, message: TeamsMessage) -> FeProject | None:
    if message.attachments:
        return _create_project_from_message(db, message)
    return _apply_review_response_from_message(db, message)


def _create_project_from_message(db: Session, message: TeamsMessage) -> FeProject | None:
    existing = db.scalar(select(Project).where(Project.source_message_id == message.id))
    if existing:
        return get_project(db, existing.project_code)

    attachment_document_ids = [item.external_id for item in message.attachments if item.external_id]
    if attachment_document_ids:
        existing_code = db.scalar(
            select(Project.project_code)
            .join(Project.documents)
            .where(ProjectDocument.document_id.in_(attachment_document_ids))
            .limit(1)
        )
        if existing_code:
            return get_project(db, existing_code)

    sender_email = (message.sender_email or "").lower()
    if not sender_email:
        return None

    sender = db.scalar(select(User).where(User.email == sender_email))
    if not sender:
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


def _apply_review_response_from_message(db: Session, message: TeamsMessage) -> FeProject | None:
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
            Project.status == ProjectStatus.ACTIVE,
        )
        .order_by(Project.updated_at.desc())
    )
    if not project or project.current_step is None:
        return None

    current_row = next((s for s in project.steps if s.step_code == project.current_step), None)
    if current_row is None or current_row.status not in {DocumentStatus.PENDING, DocumentStatus.REVISION}:
        return None
    if not current_row.custodian or current_row.custodian.email.lower() != sender_email:
        return None

    decision = _infer_decision(message.subject, message.body_text)
    if decision is None:
        return None

    return submit_review_decision(
        db,
        project.project_code,
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


def _activate_step(db: Session, project: Project, step_code: FunnelStepCode, now: datetime, default_sla_hours: int) -> ProjectStep:
    step_def = FUNNEL_STEP_BY_CODE[step_code]
    step_row = next((s for s in project.steps if s.step_code == step_code), None)
    if step_row is None:
        step_row = ProjectStep(project_id=project.id, step_code=step_code)
        db.add(step_row)
        project.steps.append(step_row)

    custodian_id = _officer_id_for_role(project, primary_role_for_step(step_code))
    due_hours = project.sla_limit_hours or default_sla_hours

    step_row.status = DocumentStatus.PENDING
    step_row.custodian_id = custodian_id
    step_row.started_at = now
    step_row.due_at = now + timedelta(hours=due_hours)
    step_row.first_notified_at = now
    step_row.overdue_notified_at = None

    project.current_phase = step_def.phase
    project.current_step = step_code
    db.flush()
    return step_row


def _audit(
    db: Session,
    project_id: int,
    actor_id: int | None,
    project_step_id: int | None,
    event_type: str,
    title: str,
    description: str | None,
) -> AuditEvent:
    event = AuditEvent(
        project_id=project_id,
        actor_id=actor_id,
        project_step_id=project_step_id,
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
    project_step_id: int | None,
    notification_type: str,
    title: str,
    body: str,
    push_data: dict[str, str] | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        project_id=project_id,
        project_step_id=project_step_id,
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
    if project_step_id is not None:
        payload["project_step_id"] = str(project_step_id)
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


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value
