from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.gemini import text_to_sql_and_execute, key_manager

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    return await text_to_sql_and_execute(request.question, db)


@router.get("/key-status")
async def key_status():
    return key_manager.status()
