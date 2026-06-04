from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

# Employee Schemas
class EmployeeBase(BaseModel):
    employee_id: str = Field(..., description="Unique alphanumeric identifier")
    name: str = Field(..., description="Full Name of the employee")
    hourly_rate: float = Field(..., ge=0, description="Base pay hourly rate")
    is_active: bool = Field(True, description="Operational status of the employee")

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None

class EmployeeOut(EmployeeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Extra Work Schemas
class ExtraWorkBase(BaseModel):
    tag: str = Field(..., description="Description classification tag")
    amount: float = Field(..., ge=0, description="Flat rate currency value")
    description: Optional[str] = None

class ExtraWorkCreate(ExtraWorkBase):
    pass

class ExtraWorkOut(ExtraWorkBase):
    id: int
    attendance_id: int

    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceBase(BaseModel):
    employee_id: int
    date: date
    hours_logged: Optional[float] = Field(None, ge=0, description="Manually logged working hours")

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    hours_logged: Optional[float] = Field(None, ge=0)

class AttendanceOut(AttendanceBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceDetailOut(AttendanceOut):
    employee: EmployeeOut
    extra_work: List[ExtraWorkOut] = []

    class Config:
        from_attributes = True

# Cash Advance Schemas
class CashAdvanceBase(BaseModel):
    employee_id: int
    date: date
    amount: float = Field(..., ge=0, description="Cash loan or payroll advance amount")
    description: Optional[str] = None

class CashAdvanceCreate(CashAdvanceBase):
    pass

class CashAdvanceOut(CashAdvanceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CashAdvanceDetailOut(CashAdvanceOut):
    employee: EmployeeOut

    class Config:
        from_attributes = True

# Payroll Cycle Schemas
class PayrollCycleBase(BaseModel):
    month: str = Field(..., description="Format YYYY-MM")

class PayrollCycleLock(PayrollCycleBase):
    pass

class PayrollCycleOut(PayrollCycleBase):
    id: int
    is_locked: bool
    locked_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Monthly Summary schemas
class MonthlySummaryItem(BaseModel):
    employee_db_id: int
    employee_id: str
    name: str
    aggregate_hours: float
    base_pay_subtotal: float
    aggregated_extra_work: float
    advance_reductions: float
    net_cash_payout: float
    is_active: bool

class MonthlySummaryResponse(BaseModel):
    month: str
    is_locked: bool
    items: List[MonthlySummaryItem]
    total_hours: float
    total_base_pay: float
    total_extra_work: float
    total_advances: float
    total_net_payout: float
