from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import analytics as svc
from app.schemas.schemas import CustomerListResponse, CustomerTopItem, CustomerByCountry

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("/top")
async def top_customers(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    rows = await svc.get_top_customers(db, limit)
    return [dict(r) for r in rows]


@router.get("/by-country")
async def customers_by_country(db: AsyncSession = Depends(get_db)):
    rows = await svc.get_customers_by_country(db)
    return [dict(r) for r in rows]


@router.get("")
async def list_customers(
    search: str = Query(""),
    country: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total, data = await svc.get_customers_list(db, search, country, page, limit)
    return {"total": total, "page": page, "limit": limit, "data": [dict(r) for r in data]}
