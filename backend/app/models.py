import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False) # Alphanumeric ID
    name = Column(String, nullable=False)
    hourly_rate = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    attendance = relationship("AttendanceLedger", back_populates="employee", cascade="all, delete-orphan")
    advances = relationship("CashAdvance", back_populates="employee", cascade="all, delete-orphan")


class AttendanceLedger(Base):
    __tablename__ = "attendance_ledger"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    hours_logged = Column(Float, nullable=True) # If positive entry, present. If null, absent.
    status = Column(String, default="Absent", nullable=False) # "Present" or "Absent"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="attendance")
    extra_work = relationship("ExtraWork", back_populates="attendance", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="_employee_date_uc"),
    )


class ExtraWork(Base):
    __tablename__ = "extra_work"

    id = Column(Integer, primary_key=True, index=True)
    attendance_id = Column(Integer, ForeignKey("attendance_ledger.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String, nullable=False) # "Husk Packing", "Rice delivery", "Paddy", or Custom
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)

    attendance = relationship("AttendanceLedger", back_populates="extra_work")


class CashAdvance(Base):
    __tablename__ = "cash_advances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="advances")


class PayrollCycle(Base):
    __tablename__ = "payroll_cycles"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, unique=True, index=True, nullable=False) # Format "YYYY-MM"
    is_locked = Column(Boolean, default=False, nullable=False)
    locked_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    action = Column(String, nullable=False) # "CREATE", "UPDATE", "DELETE", "LOCK", "ERROR"
    entity = Column(String, nullable=False) # "Employee", "Attendance", "Cash Advance", "Cycle"
    message = Column(String, nullable=False)


class PaddySupplier(Base):
    __tablename__ = "paddy_suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    contact_number = Column(String, nullable=False)
    location = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    deliveries = relationship("PaddyDelivery", back_populates="supplier", cascade="all, delete-orphan")


class PaddyDelivery(Base):
    __tablename__ = "paddy_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("paddy_suppliers.id", ondelete="CASCADE"), nullable=False)
    delivery_date = Column(Date, nullable=False)
    variety = Column(String, nullable=False)
    weight = Column(Float, nullable=False) # Net Payload Weight in Quintals
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    supplier = relationship("PaddySupplier", back_populates="deliveries")
