from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import analytics as svc

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("/over-time")
async def orders_over_time(
    granularity: str = Query("month", pattern="^(month|quarter|year)$"),
    db: AsyncSession = Depends(get_db),
):
    rows = await svc.get_orders_over_time(db, granularity)
    return [dict(r) for r in rows]


@router.get("/status-distribution")
async def order_status_distribution(db: AsyncSession = Depends(get_db)):
    rows = await svc.get_order_status_distribution(db)
    return [dict(r) for r in rows]


@router.get("")
async def list_orders(
    status: str = Query(""),
    from_date: str = Query(""),
    to_date: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total, data = await svc.get_orders_list(db, status, from_date, to_date, page, limit)
    return {"total": total, "page": page, "limit": limit, "data": [dict(r) for r in data]}
