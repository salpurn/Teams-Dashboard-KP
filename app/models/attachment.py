from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.enums import AttachmentKind

class MessageAttachment(Base):
    __tablename__ = "message_attachments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    message_id: Mapped[int] = mapped_column(ForeignKey("teams_messages.id"), index=True)
    external_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    file_name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    kind: Mapped[AttachmentKind] = mapped_column(Enum(AttachmentKind), default=AttachmentKind.DOCUMENT)
    web_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    preview_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    message = relationship("TeamsMessage", back_populates="attachments")