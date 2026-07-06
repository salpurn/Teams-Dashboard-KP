from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.enums import MessageSource
from app.schemas.message import GraphNotification, MessageCreate
from app.services.graph_client import GraphClient
from app.services.message_service import create_message_with_tracking
from app.services.tracker_service import process_message_for_tracker

router = APIRouter()


@router.post("/webhook")
async def receive_graph_webhook(
    request: Request,
    validationToken: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> str | dict[str, str]:
    if validationToken:
        return PlainTextResponse(validationToken)

    body = await request.json()
    notifications = [GraphNotification.model_validate(item) for item in body.get("value", [])]
    client = GraphClient()

    for notification in notifications:
        if notification.clientState != settings.ms_webhook_client_state:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Client state tidak valid")
        if not notification.resource:
            continue

        teams_payload = await client.get_message_from_resource(notification.resource)
        if teams_payload:
            message = create_message_with_tracking(
                db,
                MessageCreate.model_validate({**teams_payload, "source": MessageSource.TEAMS_WEBHOOK}),
            )
            process_message_for_tracker(db, message)

    return {"status": "accepted"}
