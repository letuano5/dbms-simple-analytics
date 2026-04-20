from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import customers, orders, sales, products, pivot, chat, dashboard

app = FastAPI(title="ClassicModels Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [
    dashboard.router,
    customers.router,
    orders.router,
    sales.router,
    products.router,
    pivot.router,
    chat.router,
]:
    app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
