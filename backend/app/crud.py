from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import date, datetime
from typing import List, Optional
from . import models, schemas
from fastapi import HTTPException, status

def check_cycle_locked(db: Session, date_val: date) -> bool:
    """Check if the monthly payroll cycle for the given date is locked."""
    month_str = date_val.strftime("%Y-%m")
    cycle = db.query(models.PayrollCycle).filter(models.PayrollCycle.month == month_str).first()
    return cycle is not None and cycle.is_locked

def get_employee(db: Session, employee_id: int):
    return db.query(models.Employee).filter(models.Employee.id == employee_id).first()

def get_employee_by_uuid(db: Session, employee_id: str):
    return db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()

def get_employees(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False):
    query = db.query(models.Employee)
    if active_only:
        query = query.filter(models.Employee.is_active == True)
    return query.offset(skip).limit(limit).all()

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    db_employee = models.Employee(
        employee_id=employee.employee_id,
        name=employee.name,
        hourly_rate=employee.hourly_rate,
        is_active=employee.is_active
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def update_employee(db: Session, employee_id: int, employee: schemas.EmployeeUpdate):
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None
    
    update_data = employee.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

def get_attendance_by_date(db: Session, check_date: date) -> List[models.AttendanceLedger]:
    return db.query(models.AttendanceLedger).filter(models.AttendanceLedger.date == check_date).all()

def log_attendance(db: Session, attendance: schemas.AttendanceCreate):
    # Check if cycle is locked
    if check_cycle_locked(db, attendance.date):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Payroll cycle for {attendance.date.strftime('%Y-%m')} is locked. Modifications are disabled."
        )

    # Verify employee exists
    db_employee = get_employee(db, attendance.employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if entry already exists for this employee on this date
    db_attendance = db.query(models.AttendanceLedger).filter(
        models.AttendanceLedger.employee_id == attendance.employee_id,
        models.AttendanceLedger.date == attendance.date
    ).first()

    # Determine status and hours based on Requirement 3.2.2 (Implicit attendance logic)
    # Positive Entry -> Present
    # Null/None Entry -> Absent (hours logged = 0.0)
    status_str = "Present" if (attendance.hours_logged is not None and attendance.hours_logged > 0) else "Absent"
    hours_to_log = attendance.hours_logged if status_str == "Present" else 0.0

    if db_attendance:
        # Update existing
        db_attendance.hours_logged = hours_to_log
        db_attendance.status = status_str
    else:
        # Create new
        db_attendance = models.AttendanceLedger(
            employee_id=attendance.employee_id,
            date=attendance.date,
            hours_logged=hours_to_log,
            status=status_str
        )
        db.add(db_attendance)
    
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def create_extra_work(db: Session, attendance_id: int, extra_work: schemas.ExtraWorkCreate):
    # Verify attendance log exists and is not in a locked cycle
    attendance = db.query(models.AttendanceLedger).filter(models.AttendanceLedger.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance log record not found")
    
    if check_cycle_locked(db, attendance.date):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payroll cycle is locked. Modifications are disabled."
        )
    
    # Requirement 3.3.1: Every work log marked as Present can accept structural task extensions
    if attendance.status != "Present":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extra work task extensions can only be allocated to employees marked as Present."
        )

    db_extra = models.ExtraWork(
        attendance_id=attendance_id,
        tag=extra_work.tag,
        amount=extra_work.amount,
        description=extra_work.description
    )
    db.add(db_extra)
    db.commit()
    db.refresh(db_extra)
    return db_extra

def delete_extra_work(db: Session, extra_work_id: int):
    db_extra = db.query(models.ExtraWork).filter(models.ExtraWork.id == extra_work_id).first()
    if not db_extra:
        raise HTTPException(status_code=404, detail="Extra work record not found")
    
    # Verify cycle is not locked
    attendance = db.query(models.AttendanceLedger).filter(models.AttendanceLedger.id == db_extra.attendance_id).first()
    if attendance and check_cycle_locked(db, attendance.date):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payroll cycle is locked. Modifications are disabled."
        )
    
    db.delete(db_extra)
    db.commit()
    return True

def get_advances_by_month(db: Session, month_str: str) -> List[models.CashAdvance]:
    # Parse month string YYYY-MM
    try:
        year, month = map(int, month_str.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Expected YYYY-MM")
    
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    
    return db.query(models.CashAdvance).filter(
        models.CashAdvance.date >= start_date,
        models.CashAdvance.date < end_date
    ).all()

def create_cash_advance(db: Session, advance: schemas.CashAdvanceCreate):
    # Verify employee exists
    db_employee = get_employee(db, advance.employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if check_cycle_locked(db, advance.date):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payroll cycle is locked. Modifications are disabled."
        )

    db_advance = models.CashAdvance(
        employee_id=advance.employee_id,
        date=advance.date,
        amount=advance.amount,
        description=advance.description
    )
    db.add(db_advance)
    db.commit()
    db.refresh(db_advance)
    return db_advance

def delete_cash_advance(db: Session, advance_id: int):
    db_advance = db.query(models.CashAdvance).filter(models.CashAdvance.id == advance_id).first()
    if not db_advance:
        raise HTTPException(status_code=404, detail="Cash advance record not found")
    
    if check_cycle_locked(db, db_advance.date):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payroll cycle is locked. Modifications are disabled."
        )
    
    db.delete(db_advance)
    db.commit()
    return True

def get_payroll_cycle(db: Session, month_str: str):
    return db.query(models.PayrollCycle).filter(models.PayrollCycle.month == month_str).first()

def create_or_lock_payroll_cycle(db: Session, month_str: str):
    # Ensure month format is YYYY-MM
    try:
        datetime.strptime(month_str, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Expected YYYY-MM")

    cycle = get_payroll_cycle(db, month_str)
    if not cycle:
        cycle = models.PayrollCycle(month=month_str, is_locked=True, locked_at=datetime.utcnow())
        db.add(cycle)
    else:
        if cycle.is_locked:
            raise HTTPException(status_code=400, detail="Payroll cycle is already locked")
        cycle.is_locked = True
        cycle.locked_at = datetime.utcnow()
    
    db.commit()
    db.refresh(cycle)
    return cycle

def get_monthly_summary(db: Session, month_str: str) -> schemas.MonthlySummaryResponse:
    # Ensure month format is YYYY-MM
    try:
        year, month = map(int, month_str.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Expected YYYY-MM")
    
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
        
    cycle = get_payroll_cycle(db, month_str)
    is_locked = cycle.is_locked if cycle else False

    # Get all employees
    employees = db.query(models.Employee).all()
    
    items = []
    total_hours = 0.0
    total_base_pay = 0.0
    total_extra_work = 0.0
    total_advances = 0.0
    total_net_payout = 0.0

    for emp in employees:
        # Get attendance records for this month
        attendance_records = db.query(models.AttendanceLedger).filter(
            models.AttendanceLedger.employee_id == emp.id,
            models.AttendanceLedger.date >= start_date,
            models.AttendanceLedger.date < end_date
        ).all()

        emp_hours = 0.0
        emp_base_pay = 0.0
        emp_extra_work = 0.0

        for att in attendance_records:
            if att.status == "Present" and att.hours_logged:
                emp_hours += att.hours_logged
                # Daily Base Wage Earnings = Hours * Employee Base Rate (Requirement 3.2.3)
                emp_base_pay += att.hours_logged * emp.hourly_rate
                
                # Fetch extra work for this day
                extra_items = db.query(models.ExtraWork).filter(models.ExtraWork.attendance_id == att.id).all()
                emp_extra_work += sum(item.amount for item in extra_items)

        # Fetch cash advances for this month
        advances = db.query(models.CashAdvance).filter(
            models.CashAdvance.employee_id == emp.id,
            models.CashAdvance.date >= start_date,
            models.CashAdvance.date < end_date
        ).all()
        emp_advances = sum(adv.amount for adv in advances)

        # Net Monthly Payout calculation (Requirement 3.5.2)
        emp_net_payout = emp_base_pay + emp_extra_work - emp_advances

        items.append(schemas.MonthlySummaryItem(
            employee_db_id=emp.id,
            employee_id=emp.employee_id,
            name=emp.name,
            aggregate_hours=emp_hours,
            base_pay_subtotal=emp_base_pay,
            aggregated_extra_work=emp_extra_work,
            advance_reductions=emp_advances,
            net_cash_payout=emp_net_payout,
            is_active=emp.is_active
        ))

        # Accumulate totals
        total_hours += emp_hours
        total_base_pay += emp_base_pay
        total_extra_work += emp_extra_work
        total_advances += emp_advances
        total_net_payout += emp_net_payout

    return schemas.MonthlySummaryResponse(
        month=month_str,
        is_locked=is_locked,
        items=items,
        total_hours=total_hours,
        total_base_pay=total_base_pay,
        total_extra_work=total_extra_work,
        total_advances=total_advances,
        total_net_payout=total_net_payout
    )
