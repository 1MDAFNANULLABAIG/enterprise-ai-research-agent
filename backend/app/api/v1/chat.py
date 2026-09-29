import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.observability import log_audit_event
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.schemas.chat import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ChatRequest,
    MessageResponse,
    FeedbackRequest
)
from app.rag.pipeline import RAGPipeline
from app.agents.guardrails import SafetyGuardrails

router = APIRouter(prefix="/chat", tags=["Conversation & RAG Chat"])

@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convs = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).all()
    results = []
    for c in convs:
        doc_ids = json.loads(c.document_ids_json) if c.document_ids_json else []
        results.append(ConversationResponse(
            id=c.id,
            user_id=c.user_id,
            title=c.title,
            document_ids=doc_ids,
            created_at=c.created_at,
            updated_at=c.updated_at,
            messages=[]
        ))
    return results

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = Conversation(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=conv_in.title or "New Conversation",
        document_ids_json=json.dumps(conv_in.document_ids or [])
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return ConversationResponse(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        document_ids=conv_in.document_ids or [],
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[]
    )

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages_db = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
    msg_responses = []
    for m in messages_db:
        citations = json.loads(m.citations_json) if m.citations_json else []
        metrics = json.loads(m.metrics_json) if m.metrics_json else {}
        msg_responses.append(MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            citations=citations,
            metrics=metrics,
            feedback=m.feedback,
            created_at=m.created_at
        ))

    doc_ids = json.loads(conv.document_ids_json) if conv.document_ids_json else []
    return ConversationResponse(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        document_ids=doc_ids,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=msg_responses
    )

@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    conv_in: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv_in.title is not None:
        conv.title = conv_in.title
    if conv_in.document_ids is not None:
        conv.document_ids_json = json.dumps(conv_in.document_ids)

    db.commit()
    db.refresh(conv)

    doc_ids = json.loads(conv.document_ids_json) if conv.document_ids_json else []
    return ConversationResponse(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        document_ids=doc_ids,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[]
    )

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return None

@router.post("/message")
async def send_chat_message(
    chat_req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Safety inspection
    is_safe, reason = SafetyGuardrails.inspect_prompt(chat_req.message)
    if not is_safe:
        raise HTTPException(status_code=400, detail=reason)

    # Resolve or create conversation
    conv_id = chat_req.conversation_id
    if not conv_id:
        conv = Conversation(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            title=chat_req.message[:35] + ("..." if len(chat_req.message) > 35 else ""),
            document_ids_json=json.dumps(chat_req.document_ids or [])
        )
        db.add(conv)
        db.commit()
        conv_id = conv.id
    else:
        conv = db.query(Conversation).filter(
            Conversation.id == conv_id,
            Conversation.user_id == current_user.id
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

    # Record User Message
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        role="user",
        content=chat_req.message
    )
    db.add(user_msg)
    db.commit()

    # Determine document scope
    scope_ids = chat_req.document_ids
    if scope_ids is None and conv.document_ids_json:
        scope_ids = json.loads(conv.document_ids_json)

    # Run RAG
    rag = RAGPipeline()
    rag_result = await rag.query(
        query=chat_req.message,
        user_id=current_user.id,
        document_ids=scope_ids if scope_ids else None,
        provider_name=chat_req.provider,
        db=db
    )

    # Save Assistant Message
    citations_data = [c.model_dump() for c in rag_result["citations"]]
    asst_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        role="assistant",
        content=rag_result["answer"],
        citations_json=json.dumps(citations_data),
        metrics_json=json.dumps(rag_result["metrics"])
    )
    db.add(asst_msg)
    db.commit()

    log_audit_event(db, current_user.id, "CHAT_QUERY", "Conversation", conv_id, "SUCCESS")

    return {
        "conversation_id": conv_id,
        "message": {
            "id": asst_msg.id,
            "conversation_id": conv_id,
            "role": asst_msg.role,
            "content": asst_msg.content,
            "citations": rag_result["citations"],
            "metrics": rag_result["metrics"],
            "created_at": asst_msg.created_at
        }
    }

@router.post("/stream")
async def stream_chat_message(
    chat_req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_safe, reason = SafetyGuardrails.inspect_prompt(chat_req.message)
    if not is_safe:
        raise HTTPException(status_code=400, detail=reason)

    conv_id = chat_req.conversation_id
    if not conv_id:
        conv = Conversation(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            title=chat_req.message[:35] + ("..." if len(chat_req.message) > 35 else ""),
            document_ids_json=json.dumps(chat_req.document_ids or [])
        )
        db.add(conv)
        db.commit()
        conv_id = conv.id
    else:
        conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

    # Record User Message
    user_msg = Message(id=str(uuid.uuid4()), conversation_id=conv_id, role="user", content=chat_req.message)
    db.add(user_msg)
    db.commit()

    scope_ids = chat_req.document_ids or (json.loads(conv.document_ids_json) if conv.document_ids_json else None)

    async def event_generator():
        yield f"data: {json.dumps({'type': 'init', 'conversation_id': conv_id})}\n\n"
        rag = RAGPipeline()
        full_content = ""
        done_payload = None

        async for event in rag.query_stream(
            query=chat_req.message,
            user_id=current_user.id,
            document_ids=scope_ids if scope_ids else None,
            provider_name=chat_req.provider
        ):
            if event["type"] == "token":
                full_content += event["token"]
            elif event["type"] == "done":
                done_payload = event
            yield f"data: {json.dumps(event)}\n\n"

        # Persist assistant message
        citations_data = done_payload.get("citations", []) if done_payload else []
        metrics_data = done_payload.get("metrics", {}) if done_payload else {}

        from app.core.database import SessionLocal
        save_db = SessionLocal()
        try:
            asst_msg = Message(
                id=str(uuid.uuid4()),
                conversation_id=conv_id,
                role="assistant",
                content=full_content,
                citations_json=json.dumps(citations_data),
                metrics_json=json.dumps(metrics_data)
            )
            save_db.add(asst_msg)
            save_db.commit()
        finally:
            save_db.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/messages/{message_id}/feedback")
def set_message_feedback(
    message_id: str,
    feedback_req: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = db.query(Message).join(Conversation).filter(
        Message.id == message_id,
        Conversation.user_id == current_user.id
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    msg.feedback = feedback_req.feedback
    db.commit()
    return {"status": "SUCCESS", "message_id": message_id, "feedback": msg.feedback}
