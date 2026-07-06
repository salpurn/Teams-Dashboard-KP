from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import DocumentStatus, FunnelStepCode, ReviewDecision


class ProjectStep(Base):
    """Status tracking satu step funnel (P1..BASO) untuk satu project.

    Satu baris per (project, step_code) — sesuai `documents[]` di frontend
    (code/status/updatedBy/date), bukan level review generik yang dulu
    dikonfigurasi lewat API (ReviewLevel).
    """

    __tablename__ = "project_steps"
    __table_args__ = (UniqueConstraint("project_id", "step_code", name="uq_project_step"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    step_code: Mapped[FunnelStepCode] = mapped_column(Enum(FunnelStepCode), index=True)
    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), default=DocumentStatus.EMPTY, index=True)
    custodian_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    updated_by_label: Mapped[str | None] = mapped_column(String(180), nullable=True)
    decision: Mapped[ReviewDecision | None] = mapped_column(Enum(ReviewDecision), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    first_notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    overdue_notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_from_message_id: Mapped[int | None] = mapped_column(ForeignKey("teams_messages.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project = relationship("Project", back_populates="steps", foreign_keys=[project_id])
    custodian = relationship("User")
    created_from_message = relationship("TeamsMessage")
