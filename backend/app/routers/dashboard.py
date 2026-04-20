from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import analytics as svc

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
async def dashboard_kpis(db: AsyncSession = Depends(get_db)):
    return await svc.get_dashboard_kpis(db)
