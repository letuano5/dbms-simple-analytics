from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import analytics as svc

router = APIRouter(prefix="/api/pivot", tags=["pivot"])

ALLOWED_DIMS = {"country", "productLine", "year", "month", "status"}
ALLOWED_METRICS = {"revenue", "quantity", "orders"}


@router.get("/custom")
async def pivot_custom(
    row_dim: str = "country",
    col_dim: str = "productLine",
    value_metric: str = "revenue",
    db: AsyncSession = Depends(get_db),
):
    if row_dim not in ALLOWED_DIMS or col_dim not in ALLOWED_DIMS:
        raise HTTPException(400, "Invalid dimension")
    if value_metric not in ALLOWED_METRICS:
        raise HTTPException(400, "Invalid metric")
    if row_dim == col_dim:
        raise HTTPException(400, "row_dim and col_dim must differ")
    rows = await svc.get_pivot_custom(db, row_dim, col_dim, value_metric)
    return [dict(r) for r in rows]


@router.get("/productline-by-month")
async def pivot_productline_by_month(db: AsyncSession = Depends(get_db)):
    rows = await svc.get_pivot_productline_by_month(db)
    return [dict(r) for r in rows]


@router.get("/country-by-productline")
async def pivot_country_by_productline(db: AsyncSession = Depends(get_db)):
    rows = await svc.get_pivot_country_by_productline(db)
    return [dict(r) for r in rows]
