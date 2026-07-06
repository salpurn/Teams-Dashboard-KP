from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import ReviewDecision, ReviewTaskStatus


class ReviewTask(Base):
    __tablename__ = "review_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    level_id: Mapped[int] = mapped_column(ForeignKey("review_levels.id"), index=True)
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[ReviewTaskStatus] = mapped_column(
        Enum(ReviewTaskStatus), default=ReviewTaskStatus.WAITING, index=True
    )
    decision: Mapped[ReviewDecision | None] = mapped_column(Enum(ReviewDecision), nullable=True)
    response_text: Mapped[str | None] = mapped_column(Text, nullable=True)
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

    project = relationship("Project", back_populates="review_tasks", foreign_keys=[project_id])
    level = relationship("ReviewLevel", back_populates="tasks")
    manager = relationship("User")
    created_from_message = relationship("TeamsMessage")
