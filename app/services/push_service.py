import logging

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import NotificationStatus
from app.models.notification import DeviceToken

logger = logging.getLogger(__name__)

_INVALID_TOKEN_ERRORS = {"InvalidRegistration", "NotRegistered", "MismatchSenderId"}


def send_push_notification(
    db: Session,
    user_id: int,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> NotificationStatus | None:
    if not settings.fcm_server_key:
        return None

    device_tokens = db.scalars(
        select(DeviceToken).where(DeviceToken.user_id == user_id, DeviceToken.is_active.is_(True))
    ).all()
    if not device_tokens:
        return None

    token_values = [item.token for item in device_tokens]
    payload = {
        "registration_ids": token_values,
        "notification": {"title": title, "body": body},
        "data": data or {},
        "priority": "high",
    }
    headers = {
        "Authorization": f"key={settings.fcm_server_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=20) as client:
            response = client.post(settings.fcm_api_url, headers=headers, json=payload)
            response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Gagal mengirim push notification ke FCM.")
        return NotificationStatus.FAILED

    try:
        body_json = response.json()
    except ValueError:
        logger.exception("Response FCM bukan JSON yang valid.")
        return NotificationStatus.FAILED

    _deactivate_invalid_tokens(device_tokens, body_json.get("results"))
    success_count = int(body_json.get("success", 0))
    return NotificationStatus.SENT if success_count > 0 else NotificationStatus.FAILED


def _deactivate_invalid_tokens(device_tokens: list[DeviceToken], results: object) -> None:
    if not isinstance(results, list):
        return

    for index, item in enumerate(results):
        if not isinstance(item, dict):
            continue
        error = item.get("error")
        if error in _INVALID_TOKEN_ERRORS and index < len(device_tokens):
            device_tokens[index].is_active = False
