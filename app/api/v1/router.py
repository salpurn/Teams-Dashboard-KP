from fastapi import APIRouter
from app.api.v1.endpoints import graph, messages, tracker, users

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(tracker.router, prefix="/tracker", tags=["tracker"])
api_router.include_router(graph.router, prefix="/graph", tags=["graph"])