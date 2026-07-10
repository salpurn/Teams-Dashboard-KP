from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class AvailableFile(Base):
    __tablename__ = "available_files"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    size: Mapped[str] = mapped_column(String(50))
    date: Mapped[str] = mapped_column(String(50))
    file_type: Mapped[str] = mapped_column(String(10)) # pdf, docx, xlsx, etc.
    source: Mapped[str] = mapped_column(String(20)) # teams, local
    category: Mapped[str] = mapped_column(String(100)) # channel/folder name
