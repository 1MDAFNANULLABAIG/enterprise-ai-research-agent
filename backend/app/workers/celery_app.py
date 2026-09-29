from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "enterprise_ai_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True
)

@celery_app.task(name="process_document_task")
def process_document_task(document_id: str):
    from app.core.database import SessionLocal
    from app.workers.async_processor import DocumentIngestionProcessor

    db = SessionLocal()
    try:
        return DocumentIngestionProcessor.process_document_sync(db, document_id)
    finally:
        db.close()
