from fastapi import FastAPI
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import Base, engine

def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    app = FastAPI(title=settings.app_name)
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health", tags=["health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok", "environment": settings.environment}

    return app

app = create_app()
