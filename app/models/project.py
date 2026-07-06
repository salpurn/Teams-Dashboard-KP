from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import ProjectStatus


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    client_name: Mapped[str] = mapped_column(String(255), index=True)
    contract_value: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    account_manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    current_level_id: Mapped[int | None] = mapped_column(ForeignKey("review_levels.id"), nullable=True)
    current_task_id: Mapped[int | None] = mapped_column(ForeignKey("review_tasks.id"), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE, index=True)
    source_message_id: Mapped[int | None] = mapped_column(ForeignKey("teams_messages.id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    account_manager = relationship("User", foreign_keys=[account_manager_id])
    current_level = relationship("ReviewLevel", foreign_keys=[current_level_id])
    current_task = relationship("ReviewTask", foreign_keys=[current_task_id], post_update=True)
    source_message = relationship("TeamsMessage")
    documents = relationship("ProjectDocument", back_populates="project", cascade="all, delete-orphan")
    review_tasks = relationship(
        "ReviewTask",
        back_populates="project",
        cascade="all, delete-orphan",
        foreign_keys="ReviewTask.project_id",
        order_by="ReviewTask.started_at",
    )
    audit_events = relationship("AuditEvent", back_populates="project", cascade="all, delete-orphan")


class ProjectDocument(Base):
    __tablename__ = "project_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    document_id: Mapped[str | None] = mapped_column(String(160), nullable=True, index=True)
    file_name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    web_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    preview_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_primary: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="documents")
