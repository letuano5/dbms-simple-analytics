from sqlalchemy import select, func, distinct, case, text, String, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Customer, Order, OrderDetail, Product, ProductLine, Employee, Payment


# ─── Customers ────────────────────────────────────────────────────────────────

async def get_customers_list(
    db: AsyncSession,
    search: str, country: str,
    page: int, limit: int,
    sort_by: str = "customerName", sort_dir: str = "asc",
    credit_limit_min: float | None = None,
    credit_limit_max: float | None = None,
):
    revenue_sub = (
        select(
            Order.customerNumber,
            func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).label("totalRevenue"),
        )
        .join(OrderDetail, OrderDetail.orderNumber == Order.orderNumber)
        .group_by(Order.customerNumber)
        .subquery()
    )

    base = (
        select(
            Customer.customerNumber,
            Customer.customerName,
            Customer.contactLastName,
            Customer.contactFirstName,
            Customer.phone,
            Customer.city,
            Customer.state,
            Customer.country,
            Customer.creditLimit,
            Customer.salesRepEmployeeNumber,
            func.coalesce(revenue_sub.c.totalRevenue, 0).label("totalRevenue"),
        )
        .outerjoin(revenue_sub, revenue_sub.c.customerNumber == Customer.customerNumber)
    )

    if search:
        base = base.where(Customer.customerName.ilike(f"%{search}%"))
    if country:
        base = base.where(Customer.country == country)
    if credit_limit_min is not None:
        base = base.where(Customer.creditLimit >= credit_limit_min)
    if credit_limit_max is not None:
        base = base.where(Customer.creditLimit <= credit_limit_max)

    _sort_cols = {
        "customerNumber": Customer.customerNumber,
        "customerName": Customer.customerName,
        "country": Customer.country,
        "city": Customer.city,
        "creditLimit": Customer.creditLimit,
        "totalRevenue": func.coalesce(revenue_sub.c.totalRevenue, 0),
    }
    sort_col = _sort_cols.get(sort_by, Customer.customerName)
    order_expr = sort_col.desc() if sort_dir == "desc" else sort_col.asc()

    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar_one()

    rows = (
        await db.execute(base.order_by(order_expr).offset((page - 1) * limit).limit(limit))
    ).mappings().all()
    return total, list(rows)


async def get_top_customers(db: AsyncSession, limit: int):
    stmt = (
        select(
            Customer.customerNumber,
            Customer.customerName,
            Customer.country,
            func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).label("totalRevenue"),
        )
        .join(Order, Order.customerNumber == Customer.customerNumber)
        .join(OrderDetail, OrderDetail.orderNumber == Order.orderNumber)
        .group_by(Customer.customerNumber, Customer.customerName, Customer.country)
        .order_by(func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).desc())
        .limit(limit)
    )
    return (await db.execute(stmt)).mappings().all()


async def get_customers_by_country(db: AsyncSession):
    stmt = (
        select(Customer.country, func.count(Customer.customerNumber).label("count"))
        .group_by(Customer.country)
        .order_by(func.count(Customer.customerNumber).desc())
    )
    return (await db.execute(stmt)).mappings().all()


# ─── Orders ───────────────────────────────────────────────────────────────────

async def get_orders_list(
    db: AsyncSession,
    status: str, from_date: str, to_date: str,
    page: int, limit: int,
    customer_search: str = "",
    sort_by: str = "orderDate", sort_dir: str = "desc",
):
    base = (
        select(
            Order.orderNumber,
            Order.orderDate,
            Order.requiredDate,
            Order.shippedDate,
            Order.status,
            Order.comments,
            Order.customerNumber,
            Customer.customerName,
        )
        .join(Customer, Customer.customerNumber == Order.customerNumber)
    )

    if status:
        base = base.where(Order.status == status)
    if from_date:
        base = base.where(Order.orderDate >= from_date)
    if to_date:
        base = base.where(Order.orderDate <= to_date)
    if customer_search:
        base = base.where(Customer.customerName.ilike(f"%{customer_search}%"))

    _sort_cols = {
        "orderNumber": Order.orderNumber,
        "customerName": Customer.customerName,
        "orderDate": Order.orderDate,
        "requiredDate": Order.requiredDate,
        "shippedDate": Order.shippedDate,
        "status": Order.status,
    }
    sort_col = _sort_cols.get(sort_by, Order.orderDate)
    order_expr = sort_col.desc() if sort_dir == "desc" else sort_col.asc()

    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar_one()

    rows = (
        await db.execute(base.order_by(order_expr).offset((page - 1) * limit).limit(limit))
    ).mappings().all()
    return total, list(rows)


async def get_orders_over_time(db: AsyncSession, granularity: str):
    if granularity == "quarter":
        period_expr = func.concat(func.year(Order.orderDate), "-Q", func.quarter(Order.orderDate))
    elif granularity == "year":
        period_expr = func.year(Order.orderDate).cast(String)
    else:
        period_expr = func.date_format(Order.orderDate, "%Y-%m")

    stmt = (
        select(
            period_expr.label("period"),
            func.count(distinct(Order.orderNumber)).label("count"),
            func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).label("revenue"),
        )
        .join(OrderDetail, OrderDetail.orderNumber == Order.orderNumber)
        .group_by(period_expr)
        .order_by(period_expr)
    )
    return (await db.execute(stmt)).mappings().all()


async def get_order_status_distribution(db: AsyncSession):
    stmt = (
        select(Order.status, func.count(Order.orderNumber).label("count"))
        .group_by(Order.status)
    )
    return (await db.execute(stmt)).mappings().all()


# ─── Sales ────────────────────────────────────────────────────────────────────

async def get_revenue_by_period(db: AsyncSession, granularity: str):
    if granularity == "quarter":
        period_expr = func.concat(func.year(Order.orderDate), "-Q", func.quarter(Order.orderDate))
    elif granularity == "year":
        period_expr = func.year(Order.orderDate).cast(String)
    else:
        period_expr = func.date_format(Order.orderDate, "%Y-%m")

    stmt = (
        select(
            period_expr.label("period"),
            func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).label("revenue"),
        )
        .join(OrderDetail, OrderDetail.orderNumber == Order.orderNumber)
        .group_by(period_expr)
        .order_by(period_expr)
    )
    return (await db.execute(stmt)).mappings().all()


async def get_revenue_by_product_line(db: AsyncSession):
    stmt = (
        select(
            Product.productLine,
            func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).label("revenue"),
        )
        .join(Product, Product.productCode == OrderDetail.productCode)
        .group_by(Product.productLine)
        .order_by(func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).desc())
    )
    return (await db.execute(stmt)).mappings().all()


async def get_sales_rep_performance(db: AsyncSession):
    stmt = (
        select(
            Employee.employeeNumber,
            func.concat(Employee.firstName, " ", Employee.lastName).label("employeeName"),
            func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).label("totalRevenue"),
            func.count(distinct(Order.orderNumber)).label("orderCount"),
        )
        .join(Customer, Customer.salesRepEmployeeNumber == Employee.employeeNumber)
        .join(Order, Order.customerNumber == Customer.customerNumber)
        .join(OrderDetail, OrderDetail.orderNumber == Order.orderNumber)
        .group_by(Employee.employeeNumber, Employee.firstName, Employee.lastName)
        .order_by(func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).desc())
    )
    return (await db.execute(stmt)).mappings().all()


# ─── Products ─────────────────────────────────────────────────────────────────

async def get_products_list(
    db: AsyncSession,
    search: str, product_line: str,
    page: int, limit: int,
    sort_by: str = "productName", sort_dir: str = "asc",
    qty_min: int | None = None, qty_max: int | None = None,
    price_min: float | None = None, price_max: float | None = None,
):
    base = select(
        Product.productCode,
        Product.productName,
        Product.productLine,
        Product.productScale,
        Product.productVendor,
        Product.quantityInStock,
        Product.buyPrice,
        Product.MSRP,
    )
    if search:
        base = base.where(Product.productName.ilike(f"%{search}%"))
    if product_line:
        base = base.where(Product.productLine == product_line)
    if qty_min is not None:
        base = base.where(Product.quantityInStock >= qty_min)
    if qty_max is not None:
        base = base.where(Product.quantityInStock <= qty_max)
    if price_min is not None:
        base = base.where(Product.buyPrice >= price_min)
    if price_max is not None:
        base = base.where(Product.buyPrice <= price_max)

    _sort_cols = {
        "productCode": Product.productCode,
        "productName": Product.productName,
        "productLine": Product.productLine,
        "quantityInStock": Product.quantityInStock,
        "buyPrice": Product.buyPrice,
        "MSRP": Product.MSRP,
    }
    sort_col = _sort_cols.get(sort_by, Product.productName)
    order_expr = sort_col.desc() if sort_dir == "desc" else sort_col.asc()

    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar_one()

    rows = (await db.execute(base.order_by(order_expr).offset((page - 1) * limit).limit(limit))).mappings().all()
    return total, list(rows)


async def get_top_products(db: AsyncSession, limit: int):
    stmt = (
        select(
            Product.productCode,
            Product.productName,
            Product.productLine,
            func.sum(OrderDetail.quantityOrdered).label("totalSold"),
            func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).label("revenue"),
        )
        .join(OrderDetail, OrderDetail.productCode == Product.productCode)
        .group_by(Product.productCode, Product.productName, Product.productLine)
        .order_by(func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).desc())
        .limit(limit)
    )
    return (await db.execute(stmt)).mappings().all()


async def get_stock_levels(db: AsyncSession):
    stmt = (
        select(
            Product.productCode,
            Product.productName,
            Product.productLine,
            Product.quantityInStock,
            func.coalesce(func.sum(OrderDetail.quantityOrdered), 0).label("totalSold"),
        )
        .outerjoin(OrderDetail, OrderDetail.productCode == Product.productCode)
        .group_by(Product.productCode, Product.productName, Product.productLine, Product.quantityInStock)
        .order_by(Product.quantityInStock.asc())
    )
    return (await db.execute(stmt)).mappings().all()


# ─── Pivot ────────────────────────────────────────────────────────────────────

async def get_pivot_productline_by_month(db: AsyncSession):
    stmt = (
        select(
            func.date_format(Order.orderDate, "%Y-%m").label("period"),
            Product.productLine,
            func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).label("revenue"),
        )
        .join(OrderDetail, OrderDetail.orderNumber == Order.orderNumber)
        .join(Product, Product.productCode == OrderDetail.productCode)
        .group_by(func.date_format(Order.orderDate, "%Y-%m"), Product.productLine)
        .order_by(func.date_format(Order.orderDate, "%Y-%m"), Product.productLine)
    )
    return (await db.execute(stmt)).mappings().all()


async def get_pivot_country_by_productline(db: AsyncSession):
    stmt = (
        select(
            Customer.country,
            Product.productLine,
            func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach).label("revenue"),
        )
        .join(Order, Order.customerNumber == Customer.customerNumber)
        .join(OrderDetail, OrderDetail.orderNumber == Order.orderNumber)
        .join(Product, Product.productCode == OrderDetail.productCode)
        .group_by(Customer.country, Product.productLine)
        .order_by(Customer.country, Product.productLine)
    )
    return (await db.execute(stmt)).mappings().all()


# ─── Dashboard KPIs ───────────────────────────────────────────────────────────

async def get_dashboard_kpis(db: AsyncSession):
    total_revenue = (
        await db.execute(
            select(func.sum(OrderDetail.quantityOrdered * OrderDetail.priceEach))
        )
    ).scalar_one() or 0

    total_orders = (
        await db.execute(select(func.count(Order.orderNumber)))
    ).scalar_one() or 0

    total_customers = (
        await db.execute(select(func.count(Customer.customerNumber)))
    ).scalar_one() or 0

    total_products = (
        await db.execute(select(func.count(Product.productCode)))
    ).scalar_one() or 0

    return {
        "totalRevenue": float(total_revenue),
        "totalOrders": total_orders,
        "totalCustomers": total_customers,
        "totalProducts": total_products,
    }
