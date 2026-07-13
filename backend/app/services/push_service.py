import logging
from pathlib import Path

import httpx
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.service_account import Credentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import NotificationStatus
from app.models.notification import DeviceToken

logger = logging.getLogger(__name__)

_FCM_SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"]
_UNREGISTERED_ERROR_CODES = {"UNREGISTERED", "NOT_FOUND"}

_credentials: Credentials | None = None


def _get_access_token() -> str | None:
    """Ambil OAuth2 access token dari service account, di-cache & auto-refresh saat kedaluwarsa."""
    global _credentials

    if not Path(settings.firebase_service_account_file).is_file():
        logger.warning(
            "Berkas service account Firebase tidak ditemukan di %s.", settings.firebase_service_account_file
        )
        return None

    if _credentials is None:
        _credentials = Credentials.from_service_account_file(
            settings.firebase_service_account_file, scopes=_FCM_SCOPES
        )

    if not _credentials.valid:
        _credentials.refresh(GoogleAuthRequest())

    return _credentials.token


def send_push_notification(
    db: Session,
    user_id: int,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> NotificationStatus | None:
    if not settings.firebase_project_id:
        return None

    device_tokens = db.scalars(
        select(DeviceToken).where(DeviceToken.user_id == user_id, DeviceToken.is_active.is_(True))
    ).all()
    if not device_tokens:
        return None

    access_token = _get_access_token()
    if not access_token:
        return NotificationStatus.FAILED

    endpoint = f"https://fcm.googleapis.com/v1/projects/{settings.firebase_project_id}/messages:send"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    sent_count = 0
    try:
        with httpx.Client(timeout=20) as client:
            for device_token in device_tokens:
                message = {
                    "message": {
                        "token": device_token.token,
                        "notification": {"title": title, "body": body},
                        "data": data or {},
                    }
                }
                response = client.post(endpoint, headers=headers, json=message)
                if response.status_code == 200:
                    sent_count += 1
                    continue

                if _is_unregistered_error(response):
                    device_token.is_active = False
                else:
                    logger.warning(
                        "Gagal mengirim push ke token %s: %s %s",
                        device_token.id,
                        response.status_code,
                        response.text,
                    )
    except httpx.HTTPError:
        logger.exception("Gagal terhubung ke FCM HTTP v1 API.")
        return NotificationStatus.FAILED

    return NotificationStatus.SENT if sent_count > 0 else NotificationStatus.FAILED


def _is_unregistered_error(response: httpx.Response) -> bool:
    try:
        body_json = response.json()
    except ValueError:
        return False

    error = body_json.get("error", {})
    for detail in error.get("details", []):
        if detail.get("errorCode") in _UNREGISTERED_ERROR_CODES:
            return True
    return error.get("status") in _UNREGISTERED_ERROR_CODES
