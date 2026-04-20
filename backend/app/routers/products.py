from fastapi import APIRouter, Depends, Query
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
    db: AsyncSession = Depends(get_db),
):
    total, data = await svc.get_products_list(db, search, product_line, page, limit)
    return {"total": total, "page": page, "limit": limit, "data": [dict(r) for r in data]}
