from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date


class CustomerOut(BaseModel):
    customerNumber: int
    customerName: str
    contactLastName: str
    contactFirstName: str
    phone: str
    city: str
    state: Optional[str]
    country: str
    creditLimit: Optional[float]
    salesRepEmployeeNumber: Optional[int]

    class Config:
        from_attributes = True


class CustomerTopItem(BaseModel):
    customerNumber: int
    customerName: str
    country: str
    totalRevenue: float


class CustomerByCountry(BaseModel):
    country: str
    count: int


class CustomerListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[CustomerOut]


class OrderOut(BaseModel):
    orderNumber: int
    orderDate: date
    requiredDate: date
    shippedDate: Optional[date]
    status: str
    comments: Optional[str]
    customerNumber: int
    customerName: Optional[str]

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[OrderOut]


class OrderOverTime(BaseModel):
    period: str
    count: int
    revenue: float


class OrderStatusDist(BaseModel):
    status: str
    count: int


class RevenueByPeriod(BaseModel):
    period: str
    revenue: float


class RevenueByProductLine(BaseModel):
    productLine: str
    revenue: float


class SalesRepPerformance(BaseModel):
    employeeNumber: int
    employeeName: str
    totalRevenue: float
    orderCount: int


class ProductOut(BaseModel):
    productCode: str
    productName: str
    productLine: str
    productScale: str
    productVendor: str
    quantityInStock: int
    buyPrice: float
    MSRP: float

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[ProductOut]


class TopProduct(BaseModel):
    productCode: str
    productName: str
    productLine: str
    totalSold: int
    revenue: float


class StockLevel(BaseModel):
    productCode: str
    productName: str
    productLine: str
    quantityInStock: int
    totalSold: int


class PivotRow(BaseModel):
    row_key: str
    values: dict


class ChatRequest(BaseModel):
    question: str
    history: Optional[List[dict]] = []


class ChatResponse(BaseModel):
    sql: str
    columns: List[str]
    rows: List[List[Any]]
    explanation: str
    row_count: int
