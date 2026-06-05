import os
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional

from .database import engine, Base, get_db, SessionLocal
from . import models, schemas, crud, report_generator

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty for demo/testing
db = SessionLocal()
try:
    if db.query(models.Employee).count() == 0:
        seed_employees = [
            models.Employee(employee_id="EMP001", name="Arjun Patel", hourly_rate=25.50, is_active=True),
            models.Employee(employee_id="EMP002", name="Deepa Sharma", hourly_rate=32.00, is_active=True),
            models.Employee(employee_id="EMP003", name="Rohan Das", hourly_rate=20.00, is_active=True),
            models.Employee(employee_id="EMP004", name="Meera Nair", hourly_rate=28.50, is_active=True),
        ]
        db.add_all(seed_employees)
        db.commit()
finally:
    db.close()

app = FastAPI(
    title="Payroll Management API",
    version="3.0",
    description="Decoupled backend engine for attendance tracking and payroll calculations."
)

# CORS Setup - Requirement 4.4.1
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:4173",
]

# Allow overriding/appending via environment variables
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    for origin in allowed_origins_env.split(","):
        origins.append(origin.strip())

# Support wildcard override if specified
if "*" in origins or os.getenv("ALLOW_ALL_CORS") == "true":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# --- EMPLOYEE API ROUTES ---

@app.get("/api/employees", response_model=List[schemas.EmployeeOut])
def get_employees(active_only: bool = False, db: Session = Depends(get_db)):
    """Retrieve all employees registered in the system."""
    return crud.get_employees(db, active_only=active_only)

@app.post("/api/employees", response_model=schemas.EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    """Create a new employee profile with an alphanumeric ID."""
    db_emp = crud.get_employee_by_uuid(db, employee.employee_id)
    if db_emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID '{employee.employee_id}' is already registered."
        )
    return crud.create_employee(db, employee)

@app.put("/api/employees/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(employee_id: int, employee: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    """Update employee configuration parameters (hourly rate, name, status)."""
    db_emp = crud.update_employee(db, employee_id, employee)
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_emp


# --- ATTENDANCE LEDGER API ROUTES ---

@app.get("/api/attendance", response_model=List[schemas.AttendanceDetailOut])
def get_attendance(date_str: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all attendance and extra work items logged for a specific date (YYYY-MM-DD)."""
    if not date_str:
        check_date = date.today()
    else:
        try:
            check_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            
    # Always make sure we return logs for all active employees for this date
    # Fetch active employees
    active_employees = crud.get_employees(db, active_only=True)
    
    # Fetch existing attendance logs for this date
    existing_logs = crud.get_attendance_by_date(db, check_date)
    existing_map = {log.employee_id: log for log in existing_logs}
    
    results = []
    for emp in active_employees:
        if emp.id in existing_map:
            results.append(existing_map[emp.id])
        else:
            transient_log = models.AttendanceLedger(
                id=0,
                employee_id=emp.id,
                date=check_date,
                hours_logged=None,
                status="Absent",
                employee=emp,
                extra_work=[],
                created_at=datetime.utcnow()
            )
            results.append(transient_log)
            
    return results

@app.post("/api/attendance", response_model=schemas.AttendanceOut)
def log_attendance(attendance: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    """Record hours worked for an employee. Updates state to Present if hours > 0, else Absent."""
    return crud.log_attendance(db, attendance)

@app.post("/api/attendance/{attendance_id}/extra-work", response_model=schemas.ExtraWorkOut)
def add_extra_work(attendance_id: int, extra_work: schemas.ExtraWorkCreate, db: Session = Depends(get_db)):
    """Append a flat-rate task extension (Husk Packing, Rice Delivery, Paddy, Custom) to a present log."""
    return crud.create_extra_work(db, attendance_id, extra_work)

@app.delete("/api/attendance/extra-work/{extra_work_id}")
def delete_extra_work(extra_work_id: int, db: Session = Depends(get_db)):
    """Remove an extra work task allocation."""
    crud.delete_extra_work(db, extra_work_id)
    return {"message": "Extra work record removed successfully"}


# --- CASH ADVANCE API ROUTES ---

@app.get("/api/advances", response_model=List[schemas.CashAdvanceDetailOut])
def get_advances(month: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    """Retrieve all cash advances issued during the active calendar cycle."""
    return crud.get_advances_by_month(db, month)

@app.post("/api/advances", response_model=schemas.CashAdvanceOut)
def create_cash_advance(advance: schemas.CashAdvanceCreate, db: Session = Depends(get_db)):
    """Record a cash loan or payroll advance."""
    return crud.create_cash_advance(db, advance)

@app.delete("/api/advances/{advance_id}")
def delete_cash_advance(advance_id: int, db: Session = Depends(get_db)):
    """Void a cash advance record."""
    crud.delete_cash_advance(db, advance_id)
    return {"message": "Cash advance record voided successfully"}


# --- PAYROLL CYCLE & LOCKING API ROUTES ---

@app.get("/api/cycles", response_model=List[schemas.PayrollCycleOut])
def get_cycles(db: Session = Depends(get_db)):
    """Get all payroll cycles and lock states."""
    return db.query(models.PayrollCycle).all()

@app.get("/api/cycles/{month}", response_model=schemas.PayrollCycleOut)
def get_cycle(month: str, db: Session = Depends(get_db)):
    """Check lock status of a specific calendar month cycle."""
    cycle = crud.get_payroll_cycle(db, month)
    if not cycle:
        return schemas.PayrollCycleOut(month=month, id=0, is_locked=False, locked_at=None)
    return cycle

@app.post("/api/cycles/lock", response_model=schemas.PayrollCycleOut)
def lock_payroll_cycle(lock_data: schemas.PayrollCycleLock, db: Session = Depends(get_db)):
    """Hard-lock a monthly cycle. All entries within this month become immutable."""
    return crud.create_or_lock_payroll_cycle(db, lock_data.month)


# --- REPORTING & EXPORT API ROUTES ---

@app.get("/api/reports/summary", response_model=schemas.MonthlySummaryResponse)
def get_monthly_summary(month: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    """Compile aggregated payroll data metrics for a calendar month."""
    return crud.get_monthly_summary(db, month)

@app.get("/api/reports/excel")
def export_excel(month: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    """Generate and stream a styled Excel ledger sheet."""
    summary = crud.get_monthly_summary(db, month)
    excel_file = report_generator.generate_excel_report(summary)
    
    filename = f"Payroll_Report_{month}.xlsx"
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/reports/pdf")
def export_pdf(month: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    """Generate and stream print-ready accounting vouchers and summary registers."""
    summary = crud.get_monthly_summary(db, month)
    pdf_file = report_generator.generate_pdf_report(summary)
    
    filename = f"Payroll_Report_{month}.pdf"
    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/employees/{employee_id}/attendance", response_model=schemas.EmployeeMonthlyReportResponse)
def get_employee_monthly_attendance_report(
    employee_id: int, 
    month: str = Query(..., description="Format YYYY-MM"), 
    db: Session = Depends(get_db)
):
    """Retrieve daily attendance, extra work, and advances for an employee over a specific month."""
    import calendar
    # Verify employee exists
    emp = crud.get_employee(db, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    try:
        year, m_val = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Expected YYYY-MM")

    # Determine number of days in the month
    num_days = calendar.monthrange(year, m_val)[1]
    start_date = date(year, m_val, 1)
    end_date = date(year, m_val, num_days)

    # Query attendance records for this month
    attendance_records = db.query(models.AttendanceLedger).filter(
        models.AttendanceLedger.employee_id == employee_id,
        models.AttendanceLedger.date >= start_date,
        models.AttendanceLedger.date <= end_date
    ).all()

    # Query cash advances for this month
    advances = db.query(models.CashAdvance).filter(
        models.CashAdvance.employee_id == employee_id,
        models.CashAdvance.date >= start_date,
        models.CashAdvance.date <= end_date
    ).all()

    # Create maps for fast lookup
    attendance_map = {att.date: att for att in attendance_records}
    advances_map = {}
    for adv in advances:
        advances_map.setdefault(adv.date, []).append(adv)

    days_data = []
    total_hours = 0.0
    total_base_pay = 0.0
    total_extra_work = 0.0
    total_advances = 0.0

    for d in range(1, num_days + 1):
        curr_date = date(year, m_val, d)
        
        # Check attendance
        att = attendance_map.get(curr_date)
        status_str = att.status if att else "Absent"
        hours_logged = att.hours_logged if (att and att.status == "Present") else 0.0
        
        # Base pay calculations
        base_pay = hours_logged * emp.hourly_rate
        
        # Extra work items
        extra_work_items = []
        extra_work_amount = 0.0
        if att:
            extra_items = db.query(models.ExtraWork).filter(models.ExtraWork.attendance_id == att.id).all()
            for item in extra_items:
                extra_work_items.append(schemas.ExtraWorkReportItem(
                    tag=item.tag,
                    amount=item.amount,
                    description=item.description
                ))
                extra_work_amount += item.amount
        
        # Advances
        advs = advances_map.get(curr_date, [])
        advance_items = []
        advance_amount = 0.0
        for adv in advs:
            advance_items.append(schemas.CashAdvanceReportItem(
                amount=adv.amount,
                description=adv.description
            ))
            advance_amount += adv.amount
            
        # Daily Net Pay
        net_pay = base_pay + extra_work_amount - advance_amount

        days_data.append(schemas.EmployeeMonthlyReportDay(
            date=curr_date,
            status=status_str,
            hours_logged=hours_logged,
            base_rate=emp.hourly_rate,
            base_pay=base_pay,
            extra_work_amount=extra_work_amount,
            extra_work_items=extra_work_items,
            advance_amount=advance_amount,
            advance_items=advance_items,
            net_pay=net_pay
        ))

        # Accumulate totals
        total_hours += hours_logged
        total_base_pay += base_pay
        total_extra_work += extra_work_amount
        total_advances += advance_amount

    total_net_payout = total_base_pay + total_extra_work - total_advances

    return schemas.EmployeeMonthlyReportResponse(
        employee_id=emp.employee_id,
        name=emp.name,
        hourly_rate=emp.hourly_rate,
        month=month,
        days=days_data,
        total_hours=total_hours,
        total_base_pay=total_base_pay,
        total_extra_work=total_extra_work,
        total_advances=total_advances,
        total_net_payout=total_net_payout
    )


@app.get("/api/employees/{employee_id}/attendance/excel")
def export_employee_excel_report(
    employee_id: int, 
    month: str = Query(..., description="Format YYYY-MM"), 
    db: Session = Depends(get_db)
):
    """Generate and stream an individual employee's styled Excel monthly log report."""
    report = get_employee_monthly_attendance_report(employee_id, month, db)
    excel_file = report_generator.generate_employee_excel_report(report)
    
    filename = f"Employee_Report_{report.employee_id}_{month}.xlsx"
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/employees/{employee_id}/attendance/pdf")
def export_employee_pdf_report(
    employee_id: int, 
    month: str = Query(..., description="Format YYYY-MM"), 
    db: Session = Depends(get_db)
):
    """Generate and stream an individual employee's print-ready PDF monthly log report."""
    report = get_employee_monthly_attendance_report(employee_id, month, db)
    pdf_file = report_generator.generate_employee_pdf_report(report)
    
    filename = f"Employee_Report_{report.employee_id}_{month}.pdf"
    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# --- AUDIT LOGS API ROUTES ---

@app.get("/api/audit-logs", response_model=List[schemas.AuditLogOut])
def get_audit_logs(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    """Retrieve database mutation audit logs."""
    return crud.get_audit_logs(db, skip=skip, limit=limit)

@app.delete("/api/audit-logs")
def clear_audit_logs(db: Session = Depends(get_db)):
    """Clear all database mutation audit logs."""
    crud.clear_audit_logs(db)
    return {"message": "Audit logs cleared successfully"}
