from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import analytics as svc

router = APIRouter(prefix="/api/pivot", tags=["pivot"])


@router.get("/productline-by-month")
async def pivot_productline_by_month(db: AsyncSession = Depends(get_db)):
    rows = await svc.get_pivot_productline_by_month(db)
    return [dict(r) for r in rows]


@router.get("/country-by-productline")
async def pivot_country_by_productline(db: AsyncSession = Depends(get_db)):
    rows = await svc.get_pivot_country_by_productline(db)
    return [dict(r) for r in rows]
