from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.enums import FunnelPhase, FunnelStepCode, ProjectStatus

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    client_name: Mapped[str] = mapped_column(String(255), index=True)
    contract_value: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)

    # Tim penanggung jawab per role hardcoded (AM/BUD/SDA/LEGAL) untuk project ini.
    account_manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    bud_officer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    sda_officer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    legal_officer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    current_phase: Mapped[FunnelPhase] = mapped_column(Enum(FunnelPhase), default=FunnelPhase.F0, index=True)
    current_step: Mapped[FunnelStepCode | None] = mapped_column(Enum(FunnelStepCode), nullable=True, index=True)
    status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE, index=True)
    sla_limit_hours: Mapped[int] = mapped_column(Integer, default=48)

    source_message_id: Mapped[int | None] = mapped_column(ForeignKey("teams_messages.id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    account_manager = relationship("User", foreign_keys=[account_manager_id])
    bud_officer = relationship("User", foreign_keys=[bud_officer_id])
    sda_officer = relationship("User", foreign_keys=[sda_officer_id])
    legal_officer = relationship("User", foreign_keys=[legal_officer_id])
    source_message = relationship("TeamsMessage")
    documents = relationship("ProjectDocument", back_populates="project", cascade="all, delete-orphan")
    steps = relationship(
        "ProjectStep",
        back_populates="project",
        cascade="all, delete-orphan",
        foreign_keys="ProjectStep.project_id",
        order_by="ProjectStep.id",
    )
    audit_events = relationship("AuditEvent", back_populates="project", cascade="all, delete-orphan")


class ProjectDocument(Base):
    """Metadata file/attachment nyata (dari Teams/SharePoint) yang ditautkan ke sebuah step funnel."""

    __tablename__ = "project_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    step_code: Mapped[FunnelStepCode | None] = mapped_column(Enum(FunnelStepCode), nullable=True, index=True)
    document_id: Mapped[str | None] = mapped_column(String(160), nullable=True, index=True)
    file_name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    web_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    preview_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_primary: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="documents")
