from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# app/core/config.py -> parents[2] = backend/, terlepas dari cwd tempat uvicorn/skrip dijalankan.
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Teams Document Tracker"
    environment: str = "local"
    database_url: str = f"sqlite:///{BASE_DIR / 'teams_tracker.db'}"
    ms_tenant_id: str | None = None
    ms_client_id: str | None = None
    ms_client_secret: str | None = None
    ms_graph_base_url: str = "https://graph.microsoft.com/v1.0"
    ms_webhook_client_state: str = "change-me"
    ms_team_id: str | None = None
    ms_channel_id: str | None = None
    fcm_server_key: str | None = None
    fcm_api_url: str = "https://fcm.googleapis.com/fcm/send"
    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"), env_file_encoding="utf-8")

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()