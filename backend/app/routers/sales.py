from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import analytics as svc

router = APIRouter(prefix="/api/sales", tags=["sales"])


@router.get("/revenue")
async def revenue_by_period(
    granularity: str = Query("month", pattern="^(month|quarter|year)$"),
    db: AsyncSession = Depends(get_db),
):
    rows = await svc.get_revenue_by_period(db, granularity)
    return [dict(r) for r in rows]


@router.get("/by-product-line")
async def revenue_by_product_line(db: AsyncSession = Depends(get_db)):
    rows = await svc.get_revenue_by_product_line(db)
    return [dict(r) for r in rows]


@router.get("/rep-performance")
async def sales_rep_performance(db: AsyncSession = Depends(get_db)):
    rows = await svc.get_sales_rep_performance(db)
    return [dict(r) for r in rows]
