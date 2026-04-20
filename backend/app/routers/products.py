from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import analytics as svc

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/top-selling")
async def top_selling(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    rows = await svc.get_top_products(db, limit)
    return [dict(r) for r in rows]


@router.get("/stock-levels")
async def stock_levels(db: AsyncSession = Depends(get_db)):
    rows = await svc.get_stock_levels(db)
    return [dict(r) for r in rows]


@router.get("")
async def list_products(
    search: str = Query(""),
    product_line: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("productName"),
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    qty_min: Optional[int] = Query(None),
    qty_max: Optional[int] = Query(None),
    price_min: Optional[float] = Query(None),
    price_max: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    total, data = await svc.get_products_list(
        db, search, product_line, page, limit,
        sort_by=sort_by, sort_dir=sort_dir,
        qty_min=qty_min, qty_max=qty_max,
        price_min=price_min, price_max=price_max,
    )
    return {"total": total, "page": page, "limit": limit, "data": [dict(r) for r in data]}
