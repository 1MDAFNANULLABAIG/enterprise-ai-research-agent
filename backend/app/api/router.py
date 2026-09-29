from fastapi import APIRouter
from app.api.v1 import (
    auth,
    documents,
    chat,
    research,
    citations,
    csv_analysis,
    settings,
    admin,
    evaluation,
    health
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(documents.router)
api_router.include_router(chat.router)
api_router.include_router(research.router)
api_router.include_router(citations.router)
api_router.include_router(csv_analysis.router)
api_router.include_router(settings.router)
api_router.include_router(admin.router)
api_router.include_router(evaluation.router)
