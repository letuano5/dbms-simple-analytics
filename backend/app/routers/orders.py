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
    customer_search: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("orderDate"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    total, data = await svc.get_orders_list(
        db, status, from_date, to_date, page, limit,
        customer_search=customer_search,
        sort_by=sort_by, sort_dir=sort_dir,
    )
    return {"total": total, "page": page, "limit": limit, "data": [dict(r) for r in data]}
