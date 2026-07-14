from enum import StrEnum

class UserRole(StrEnum):
    """Peran hardcoded sesuai role switcher frontend R-EDT (AM/BUD/SDA/LEGAL/MANAGER)."""

    AM = "AM"
    BUD = "BUD"
    SDA = "SDA"
    LEGAL = "LEGAL"
    MANAGER = "MANAGER"


class FunnelPhase(StrEnum):
    """Fase sales funnel B2B R-LEGS (F0 Lead s.d. F5 Win & Eksekusi)."""

    F0 = "F0"
    F1 = "F1"
    F2 = "F2"
    F3 = "F3"
    F4 = "F4"
    F5 = "F5"


class FunnelStepCode(StrEnum):
    """Kode step dokumen funnel, urutan sesuai STAGE_FLOW frontend."""

    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"
    SPH = "SPH"
    P5 = "P5"
    P6 = "P6"
    P7 = "P7"
    SKM = "SKM"
    PA = "PA"
    SPPBJ = "SPPBJ"
    KL = "KL"
    BAST = "BAST"
    BASO = "BASO"
    P9 = "P9"


class DocumentStatus(StrEnum):
    """Status per-step dokumen, nilainya disamakan persis dengan label status frontend."""

    EMPTY = "Empty"
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    REVISION = "Revision"


class ProjectStatus(StrEnum):
    ACTIVE = "active"
    WON = "won"
    CANCELLED = "cancelled"


class ReviewDecision(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    RETURN = "return"


class MessageSource(StrEnum):
    TEAMS_WEBHOOK = "teams_webhook"
    TEAMS_SYNC = "teams_sync"
    MANUAL = "manual"


class AttachmentKind(StrEnum):
    DOCUMENT = "document"
    IMAGE = "image"
    LINK = "link"
    OTHER = "other"


class AssignmentStatus(StrEnum):
    PENDING = "pending"
    DELIVERED = "delivered"
    READ = "read"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REJECTED = "rejected"


class NotificationStatus(StrEnum):
    UNREAD = "unread"
    READ = "read"
    SENT = "sent"
    FAILED = "failed"
