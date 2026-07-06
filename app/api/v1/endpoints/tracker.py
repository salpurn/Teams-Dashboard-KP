from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.enums import NotificationStatus, ProjectStatus, ReviewTaskStatus
from app.models.message import TeamsMessage
from app.models.notification import DeviceToken, Notification
from app.models.project import Project
from app.models.project import ProjectDocument
from app.models.review_level import ReviewLevel
from app.models.review_task import ReviewTask
from app.schemas.tracker import (
    DeviceTokenCreate,
    NotificationRead,
    ProjectCreate,
    ProjectListItem,
    ProjectRead,
    ReviewDecisionCreate,
    ReviewLevelCreate,
    ReviewLevelRead,
    ReviewLevelUpdate,
    SlaSetting,
    TestPushNotificationCreate,
)
from app.services.tracker_service import (
    create_test_notification,
    create_or_update_review_level,
    create_project,
    get_project,
    get_sla_settings,
    mark_overdue_tasks,
    register_device_token,
    process_message_for_tracker,
    set_sla_settings,
    submit_review_decision,
)

router = APIRouter()


@router.get("/dashboard")
def dashboard_summary(db: Session = Depends(get_db)) -> dict:
    total = db.scalar(select(func.count(Project.id))) or 0
    active = db.scalar(select(func.count(Project.id)).where(Project.status != ProjectStatus.COMPLETED)) or 0
    completed = db.scalar(select(func.count(Project.id)).where(Project.status == ProjectStatus.COMPLETED)) or 0
    overdue = db.scalar(
        select(func.count(ReviewTask.id)).where(
            ReviewTask.status.in_([ReviewTaskStatus.WAITING, ReviewTaskStatus.IN_REVIEW]),
            ReviewTask.due_at.is_not(None),
            ReviewTask.due_at < datetime.now(UTC),
        )
    ) or 0
    return {
        "total_projects": total,
        "active_projects": active,
        "completed_projects": completed,
        "overdue_tasks": overdue,
    }


@router.get("/projects", response_model=list[ProjectListItem])
def list_projects(
    q: str | None = None,
    status_filter: ProjectStatus | None = Query(default=None, alias="status"),
    manager_email: str | None = None,
    document_id: str | None = None,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[ProjectListItem]:
    statement = (
        select(Project)
        .options(
            selectinload(Project.current_level),
            selectinload(Project.current_task).selectinload(ReviewTask.manager),
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
    if manager_email:
        statement = statement.join(Project.current_task).join(ReviewTask.manager).where(
            ReviewTask.manager.property.mapper.class_.email == manager_email.lower()
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
    return [_project_list_item(project) for project in projects]


@router.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_new_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> Project:
    return create_project(db, payload)


@router.get("/projects/{project_id}", response_model=ProjectRead)
def read_project(project_id: int, db: Session = Depends(get_db)) -> Project:
    return get_project(db, project_id)


@router.get("/projects/by-document/{document_id}", response_model=ProjectRead)
def read_project_by_document_id(document_id: str, db: Session = Depends(get_db)) -> Project:
    project_id = db.scalar(
        select(Project.id).join(Project.documents).where(ProjectDocument.document_id == document_id)
    )
    if not project_id:
        from fastapi import HTTPException

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project tidak ditemukan")
    return get_project(db, project_id)


@router.get("/projects/by-message/{message_id}", response_model=ProjectRead)
def read_project_by_message_id(message_id: int, db: Session = Depends(get_db)) -> Project:
    project = db.scalar(select(Project).where(Project.source_message_id == message_id))
    if not project:
        from fastapi import HTTPException

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project tidak ditemukan")
    return get_project(db, project.id)


@router.post("/intake/messages/{message_id}", response_model=ProjectRead | None)
def ingest_message_to_tracker(message_id: int, db: Session = Depends(get_db)) -> Project | None:
    message = db.scalar(
        select(TeamsMessage)
        .where(TeamsMessage.id == message_id)
        .options(selectinload(TeamsMessage.attachments))
    )
    if not message:
        from fastapi import HTTPException

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message tidak ditemukan")
    return process_message_for_tracker(db, message)


@router.post("/projects/{project_id}/review", response_model=ProjectRead)
def review_project(project_id: int, payload: ReviewDecisionCreate, db: Session = Depends(get_db)) -> Project:
    return submit_review_decision(db, project_id, payload)


@router.get("/review-levels", response_model=list[ReviewLevelRead])
def list_review_levels(db: Session = Depends(get_db)) -> list[ReviewLevel]:
    return list(
        db.scalars(
            select(ReviewLevel).options(selectinload(ReviewLevel.default_manager)).order_by(ReviewLevel.sequence)
        ).all()
    )


@router.post("/review-levels", response_model=ReviewLevelRead, status_code=status.HTTP_201_CREATED)
def create_review_level(payload: ReviewLevelCreate, db: Session = Depends(get_db)) -> ReviewLevel:
    return create_or_update_review_level(db, payload)


@router.patch("/review-levels/{level_id}", response_model=ReviewLevelRead)
def update_review_level(level_id: int, payload: ReviewLevelUpdate, db: Session = Depends(get_db)) -> ReviewLevel:
    return create_or_update_review_level(db, payload, level_id=level_id)


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
        from fastapi import HTTPException

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


def _project_list_item(project: Project) -> ProjectListItem:
    task = project.current_task
    now = datetime.now(UTC)
    due_at = task.due_at if task else None
    idle_hours = 0
    sla_state = "done" if project.status == ProjectStatus.COMPLETED else "on_track"
    if task:
        started_at = _aware(task.started_at)
        idle_hours = int((now - started_at).total_seconds() // 3600)
    if due_at:
        due = _aware(due_at)
        remaining_hours = int((due - now).total_seconds() // 3600)
        if remaining_hours < 0:
            sla_state = "overdue"
        elif remaining_hours < 24:
            sla_state = "warning"

    return ProjectListItem(
        id=project.id,
        project_code=project.project_code,
        title=project.title,
        client_name=project.client_name,
        contract_value=project.contract_value,
        status=project.status,
        current_level_code=project.current_level.code if project.current_level else None,
        current_level_name=project.current_level.name if project.current_level else None,
        current_manager_name=task.manager.display_name if task else None,
        due_at=due_at,
        sla_state=sla_state,
        idle_hours=idle_hours,
    )


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value
