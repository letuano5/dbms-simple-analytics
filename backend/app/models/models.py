from sqlalchemy import Column, Integer, String, Date, SmallInteger, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Office(Base):
    __tablename__ = "offices"
    officeCode  = Column(String(10), primary_key=True)
    city        = Column(String(50), nullable=False)
    phone       = Column(String(50), nullable=False)
    addressLine1 = Column(String(50), nullable=False)
    addressLine2 = Column(String(50))
    state       = Column(String(50))
    country     = Column(String(50), nullable=False)
    postalCode  = Column(String(15), nullable=False)
    territory   = Column(String(10), nullable=False)
    employees   = relationship("Employee", back_populates="office")


class Employee(Base):
    __tablename__ = "employees"
    employeeNumber = Column(Integer, primary_key=True)
    lastName    = Column(String(50), nullable=False)
    firstName   = Column(String(50), nullable=False)
    extension   = Column(String(10), nullable=False)
    email       = Column(String(100), nullable=False)
    officeCode  = Column(String(10), ForeignKey("offices.officeCode"), nullable=False)
    reportsTo   = Column(Integer, ForeignKey("employees.employeeNumber"))
    jobTitle    = Column(String(50), nullable=False)
    office      = relationship("Office", back_populates="employees")
    customers   = relationship("Customer", back_populates="sales_rep")


class Customer(Base):
    __tablename__ = "customers"
    customerNumber = Column(Integer, primary_key=True)
    customerName   = Column(String(50), nullable=False)
    contactLastName  = Column(String(50), nullable=False)
    contactFirstName = Column(String(50), nullable=False)
    phone       = Column(String(50), nullable=False)
    addressLine1 = Column(String(50), nullable=False)
    addressLine2 = Column(String(50))
    city        = Column(String(50), nullable=False)
    state       = Column(String(50))
    postalCode  = Column(String(15))
    country     = Column(String(50), nullable=False)
    salesRepEmployeeNumber = Column(Integer, ForeignKey("employees.employeeNumber"))
    creditLimit = Column(Numeric(10, 2))
    sales_rep   = relationship("Employee", back_populates="customers")
    orders      = relationship("Order", back_populates="customer")
    payments    = relationship("Payment", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"
    orderNumber    = Column(Integer, primary_key=True)
    orderDate      = Column(Date, nullable=False)
    requiredDate   = Column(Date, nullable=False)
    shippedDate    = Column(Date)
    status         = Column(String(15), nullable=False)
    comments       = Column(Text)
    customerNumber = Column(Integer, ForeignKey("customers.customerNumber"), nullable=False)
    customer       = relationship("Customer", back_populates="orders")
    orderdetails   = relationship("OrderDetail", back_populates="order")


class OrderDetail(Base):
    __tablename__ = "orderdetails"
    orderNumber     = Column(Integer, ForeignKey("orders.orderNumber"), primary_key=True)
    productCode     = Column(String(15), ForeignKey("products.productCode"), primary_key=True)
    quantityOrdered = Column(Integer, nullable=False)
    priceEach       = Column(Numeric(10, 2), nullable=False)
    orderLineNumber = Column(SmallInteger, nullable=False)
    order   = relationship("Order", back_populates="orderdetails")
    product = relationship("Product", back_populates="orderdetails")


class ProductLine(Base):
    __tablename__ = "productlines"
    productLine     = Column(String(50), primary_key=True)
    textDescription = Column(String(4000))
    htmlDescription = Column(Text)
    products        = relationship("Product", back_populates="product_line_rel")


class Product(Base):
    __tablename__ = "products"
    productCode     = Column(String(15), primary_key=True)
    productName     = Column(String(70), nullable=False)
    productLine     = Column(String(50), ForeignKey("productlines.productLine"), nullable=False)
    productScale    = Column(String(10), nullable=False)
    productVendor   = Column(String(50), nullable=False)
    productDescription = Column(Text, nullable=False)
    quantityInStock = Column(SmallInteger, nullable=False)
    buyPrice        = Column(Numeric(10, 2), nullable=False)
    MSRP            = Column(Numeric(10, 2), nullable=False)
    product_line_rel = relationship("ProductLine", back_populates="products")
    orderdetails     = relationship("OrderDetail", back_populates="product")


class Payment(Base):
    __tablename__ = "payments"
    customerNumber = Column(Integer, ForeignKey("customers.customerNumber"), primary_key=True)
    checkNumber    = Column(String(50), primary_key=True)
    paymentDate    = Column(Date, nullable=False)
    amount         = Column(Numeric(10, 2), nullable=False)
    customer       = relationship("Customer", back_populates="payments")
