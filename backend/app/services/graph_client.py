import httpx

from app.core.config import settings


class GraphClient:
    def __init__(self) -> None:
        self.base_url = settings.ms_graph_base_url.rstrip("/")

    async def get_message_from_resource(self, resource: str) -> dict | None:
        token = await self._get_access_token()
        if not token:
            return None

        url = f"{self.base_url}/{resource.lstrip('/')}"
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(url, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
            data = response.json()

        return self._map_graph_message(data)

    async def _get_access_token(self) -> str | None:
        if not all([settings.ms_tenant_id, settings.ms_client_id, settings.ms_client_secret]):
            return None

        url = f"https://login.microsoftonline.com/{settings.ms_tenant_id}/oauth2/v2.0/token"
        payload = {
            "client_id": settings.ms_client_id,
            "client_secret": settings.ms_client_secret,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(url, data=payload)
            response.raise_for_status()
            return response.json()["access_token"]

    def _map_graph_message(self, data: dict) -> dict:
        sender = data.get("from", {}).get("user", {}) if data.get("from") else {}
        attachments = [
            {
                "external_id": item.get("id"),
                "file_name": item.get("name") or item.get("contentUrl") or "attachment",
                "content_type": item.get("contentType"),
                "web_url": item.get("contentUrl"),
            }
            for item in data.get("attachments", [])
        ]

        return {
            "teams_message_id": data.get("id"),
            "thread_id": data.get("replyToId") or data.get("id"),
            "subject": data.get("subject"),
            "body_text": data.get("body", {}).get("content") or data.get("summary") or "",
            "sender_name": sender.get("displayName"),
            "sender_email": sender.get("email") or sender.get("userPrincipalName"),
            "sent_at": data.get("createdDateTime"),
            "attachments": attachments,
            "assignments": [],
        }
