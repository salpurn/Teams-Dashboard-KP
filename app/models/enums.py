from enum import StrEnum

class AssignmentStatus(StrEnum):
    PENDING = "pending"
    DELIVERED = "delivered"
    READ = "read"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REJECTED = "rejected"

class MessageSource(StrEnum):
    TEAMS_WEBHOOK = "teams_webhook"
    TEAMS_SYNC = "teams_sync"
    MANUAL = "manual"

class AttachmentKind(StrEnum):
    DOCUMENT = "document"
    IMAGE = "image"
    LINK = "link"
    OTHER = "other"


class ProjectStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    WAITING_REVIEW = "waiting_review"
    COMPLETED = "completed"
    REJECTED = "rejected"
    RETURNED = "returned"


class ReviewTaskStatus(StrEnum):
    WAITING = "waiting"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    RETURNED = "returned"
    SKIPPED = "skipped"


class ReviewDecision(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    RETURN = "return"


class NotificationStatus(StrEnum):
    UNREAD = "unread"
    READ = "read"
    SENT = "sent"
    FAILED = "failed"
