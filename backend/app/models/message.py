from datetime import datetime
from sqlalchemy import DateTime, Enum, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.enums import MessageSource

class TeamsMessage(Base):
    __tablename__ = "teams_messages"
    __table_args__ = (
        UniqueConstraint("team_id", "channel_id", "teams_message_id", name="uq_teams_message"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source: Mapped[MessageSource] = mapped_column(Enum(MessageSource), default=MessageSource.MANUAL)
    team_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    team_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    channel_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    channel_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    thread_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    teams_message_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body_text: Mapped[str] = mapped_column(Text)
    sender_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    sender_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    attachments = relationship("MessageAttachment", back_populates="message", cascade="all, delete-orphan")
    assignments = relationship("MessageAssignment", back_populates="message", cascade="all, delete-orphan")