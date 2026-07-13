from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session, selectinload
from app.core.funnel import FUNNEL_PHASES, FUNNEL_STEP_BY_CODE
from app.db.session import get_db
from app.models.audit import AuditEvent
from app.models.enums import DocumentStatus, NotificationStatus, ProjectStatus
from app.models.message import TeamsMessage
from app.models.notification import DeviceToken, Notification
from app.models.project import Project, ProjectDocument
from app.models.project_step import ProjectStep
from app.models.user import User
from app.models.available_file import AvailableFile
from app.schemas.tracker import (
    DeviceTokenCreate,
    FeProject,
    FunnelPhaseInfo,
    FunnelStepInfo,
    NotificationRead,
    ProjectCreate,
    ReviewDecisionCreate,
    SlaSetting,
    TestPushNotificationCreate,
    AvailableFileSchema,
)
from app.services.tracker_service import (
    create_project,
    create_test_notification,
    get_project,
    get_sla_settings,
    list_fe_projects,
    mark_overdue_tasks,
    process_message_for_tracker,
    register_device_token,
    set_sla_settings,
    submit_review_decision,
)

router = APIRouter()

@router.get("/funnel", response_model=list[FunnelPhaseInfo])
def read_funnel_catalog() -> list[FunnelPhaseInfo]:
    """Katalog fase & step funnel yang hardcoded (bukan CRUD) - referensi untuk FE."""
    return [
        FunnelPhaseInfo(
            phase=phase_def.phase,
            name=phase_def.name,
            description=phase_def.description,
            steps=[
                FunnelStepInfo(
                    code=step_def.code,
                    name=step_def.name,
                    phase=step_def.phase,
                    sequence=step_def.sequence,
                    responsibleRoles=list(step_def.responsible_roles),
                    isCancellationGate=step_def.is_cancellation_gate,
                )
                for step_def in FUNNEL_STEP_BY_CODE.values()
                if step_def.phase == phase_def.phase
            ],
        )
        for phase_def in FUNNEL_PHASES
    ]


@router.get("/dashboard")
def dashboard_summary(db: Session = Depends(get_db)) -> dict:
    total = db.scalar(select(func.count(Project.id))) or 0
    active = db.scalar(select(func.count(Project.id)).where(Project.status == ProjectStatus.ACTIVE)) or 0
    won = db.scalar(select(func.count(Project.id)).where(Project.status == ProjectStatus.WON)) or 0
    cancelled = db.scalar(select(func.count(Project.id)).where(Project.status == ProjectStatus.CANCELLED)) or 0
    overdue = db.scalar(
        select(func.count(ProjectStep.id)).where(
            ProjectStep.status.in_([DocumentStatus.PENDING, DocumentStatus.REVISION]),
            ProjectStep.due_at.is_not(None),
            ProjectStep.due_at < datetime.now(UTC),
        )
    ) or 0
    return {
        "total_projects": total,
        "active_projects": active,
        "won_projects": won,
        "cancelled_projects": cancelled,
        "overdue_steps": overdue,
    }


@router.get("/projects", response_model=list[FeProject])
def list_projects(
    q: str | None = None,
    status_filter: ProjectStatus | None = Query(default=None, alias="status"),
    custodian_email: str | None = None,
    document_id: str | None = None,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[FeProject]:
    statement = (
        select(Project)
        .options(
            selectinload(Project.account_manager),
            selectinload(Project.steps).selectinload(ProjectStep.custodian),
            selectinload(Project.audit_events).selectinload(AuditEvent.actor),
        )
        .order_by(Project.updated_at.desc())
    )
    if q:
        pattern = f"%{q}%"
        statement = statement.where(
            Project.project_code.ilike(pattern) | Project.title.ilike(pattern) | Project.client_name.ilike(pattern)
        )
    if status_filter:
        statement = statement.where(Project.status == status_filter)
    if custodian_email:
        statement = statement.where(
            exists(
                select(1)
                .select_from(ProjectStep)
                .join(User, User.id == ProjectStep.custodian_id)
                .where(ProjectStep.project_id == Project.id, User.email == custodian_email.lower())
            )
        )
    if document_id:
        statement = statement.where(
            exists(
                select(1).select_from(ProjectDocument).where(
                    ProjectDocument.project_id == Project.id,
                    ProjectDocument.document_id == document_id,
                )
            )
        )

    projects = db.scalars(statement.limit(limit).offset(offset)).all()
    return list_fe_projects(db, projects)


@router.post("/projects", response_model=FeProject, status_code=status.HTTP_201_CREATED)
def create_new_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> FeProject:
    return create_project(db, payload)


@router.get("/projects/{project_code}", response_model=FeProject)
def read_project(project_code: str, db: Session = Depends(get_db)) -> FeProject:
    return get_project(db, project_code)


@router.get("/projects/by-document/{document_id}", response_model=FeProject)
def read_project_by_document_id(document_id: str, db: Session = Depends(get_db)) -> FeProject:
    project_code = db.scalar(
        select(Project.project_code).join(Project.documents).where(ProjectDocument.document_id == document_id)
    )
    if not project_code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project tidak ditemukan")
    return get_project(db, project_code)


@router.get("/projects/by-message/{message_id}", response_model=FeProject)
def read_project_by_message_id(message_id: int, db: Session = Depends(get_db)) -> FeProject:
    project = db.scalar(select(Project).where(Project.source_message_id == message_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project tidak ditemukan")
    return get_project(db, project.project_code)


@router.post("/intake/messages/{message_id}", response_model=FeProject | None)
def ingest_message_to_tracker(message_id: int, db: Session = Depends(get_db)) -> FeProject | None:
    message = db.scalar(
        select(TeamsMessage)
        .where(TeamsMessage.id == message_id)
        .options(selectinload(TeamsMessage.attachments))
    )
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message tidak ditemukan")
    return process_message_for_tracker(db, message)


@router.post("/projects/{project_code}/review", response_model=FeProject)
def review_project(project_code: str, payload: ReviewDecisionCreate, db: Session = Depends(get_db)) -> FeProject:
    return submit_review_decision(db, project_code, payload)


@router.get("/settings/sla", response_model=SlaSetting)
def read_sla_settings(db: Session = Depends(get_db)) -> SlaSetting:
    return get_sla_settings(db)


@router.put("/settings/sla", response_model=SlaSetting)
def update_sla_settings(payload: SlaSetting, db: Session = Depends(get_db)) -> SlaSetting:
    return set_sla_settings(db, payload)


@router.post("/scheduler/mark-overdue", response_model=list[NotificationRead])
def run_overdue_scan(db: Session = Depends(get_db)) -> list[Notification]:
    return mark_overdue_tasks(db)


@router.get("/notifications", response_model=list[NotificationRead])
def list_notifications(
    user_id: int | None = None,
    unread_only: bool = False,
    db: Session = Depends(get_db),
) -> list[Notification]:
    statement = select(Notification).order_by(Notification.created_at.desc())
    if user_id:
        statement = statement.where(Notification.user_id == user_id)
    if unread_only:
        statement = statement.where(Notification.status == NotificationStatus.UNREAD)
    return list(db.scalars(statement).all())


@router.post("/notifications/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)) -> Notification:
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notifikasi tidak ditemukan")
    notification.status = NotificationStatus.READ
    notification.read_at = datetime.now(UTC)
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/device-tokens", status_code=status.HTTP_201_CREATED)
def create_device_token(payload: DeviceTokenCreate, db: Session = Depends(get_db)) -> dict:
    token: DeviceToken = register_device_token(db, payload)
    return {"id": token.id, "status": "registered"}


@router.post("/notifications/test", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
def send_test_notification(payload: TestPushNotificationCreate, db: Session = Depends(get_db)) -> Notification:
    return create_test_notification(db, payload)


@router.get("/available-files", response_model=list[AvailableFileSchema])
def list_available_files(db: Session = Depends(get_db)) -> list[AvailableFile]:
    statement = select(AvailableFile).order_by(AvailableFile.id.asc())
    return list(db.scalars(statement).all())
