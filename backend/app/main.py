import os
import sys
import random
import json
import logging
from datetime import date, datetime, timedelta
from typing import List, Optional
import requests

import jwt
from fastapi import FastAPI, Depends, HTTPException, status, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

# Resolve parent directory in search path to import config module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config as backend_config

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

    if db.query(models.PaddySupplier).count() == 0:
        s1 = models.PaddySupplier(supplier_id="SUP-0001", name="Haran Borah", contact_number="9876543210", location="Kharupetia")
        s2 = models.PaddySupplier(supplier_id="SUP-0002", name="Bipul Saikia", contact_number="8765432109", location="Dhing")
        s3 = models.PaddySupplier(supplier_id="SUP-0003", name="Madan Mohan", contact_number="7654321098", location="Morigaon")
        db.add_all([s1, s2, s3])
        db.commit()
        db.refresh(s1)
        db.refresh(s2)
        db.refresh(s3)

        d1 = models.PaddyDelivery(supplier_id=s1.id, delivery_date=date(2024, 11, 12), variety="Ranjit", weight=120.0)
        d2 = models.PaddyDelivery(supplier_id=s1.id, delivery_date=date(2025, 5, 15), variety="Mota", weight=135.0)
        d3 = models.PaddyDelivery(supplier_id=s1.id, delivery_date=date(2025, 11, 20), variety="Ranjit", weight=140.0)
        d4 = models.PaddyDelivery(supplier_id=s1.id, delivery_date=date(2026, 5, 10), variety="Ranjit", weight=155.0)

        d5 = models.PaddyDelivery(supplier_id=s2.id, delivery_date=date(2024, 10, 5), variety="Goya", weight=80.0)
        d6 = models.PaddyDelivery(supplier_id=s2.id, delivery_date=date(2025, 11, 1), variety="Goya", weight=85.0)
        d7 = models.PaddyDelivery(supplier_id=s2.id, delivery_date=date(2026, 5, 22), variety="Mota", weight=90.0)

        d8 = models.PaddyDelivery(supplier_id=s3.id, delivery_date=date(2025, 10, 18), variety="Ranjit", weight=210.0)
        d9 = models.PaddyDelivery(supplier_id=s3.id, delivery_date=date(2026, 4, 12), variety="Ranjit", weight=220.0)

        db.add_all([d1, d2, d3, d4, d5, d6, d7, d8, d9])
        db.commit()
finally:
    db.close()

app = FastAPI(
    title="Payroll Management API",
    version="3.0",
    description="Decoupled backend engine for attendance tracking and payroll calculations."
)

# CORS Setup - Requirement 4.4.1
origins = [origin.strip() for origin in backend_config.CORS_ORIGINS.split(",") if origin.strip()]

# Allow overriding/appending via environment variables
allowed_origins_env = backend_config.ALLOWED_ORIGINS
if allowed_origins_env:
    for origin in allowed_origins_env.split(","):
        origins.append(origin.strip())


# Support wildcard override if specified
if "*" in origins or backend_config.ALLOW_ALL_CORS == "true":
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


# --- JWT AUTHENTICATION SETTINGS & HELPER FUNCTIONS ---
SECRET_KEY = backend_config.JWT_SECRET
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

security = HTTPBearer(auto_error=False)
logger = logging.getLogger("uvicorn.error")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)) -> models.User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = schemas.TokenData(email=email)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Define the protected routes router
api_router = APIRouter(dependencies=[Depends(get_current_user)])


# --- MSG91 EMAIL OTP SENDER HELPER ---
def send_otp_email(email: str, otp: str):
    auth_key = backend_config.MSG91_AUTH_KEY
    email_from = backend_config.MSG91_EMAIL_FROM
    email_domain = backend_config.MSG91_EMAIL_DOMAIN
    msg91_otp_template_id = "global_otp"
    
    # Check if MSG91 is properly configured
    if not auth_key:
        # Development fallback mode
        logger.info(f"\n============================================\n*** [DEV MODE OTP] Send OTP to: {email} -> {otp} ***\n============================================\n")
        return True
        
    # Standard modern MSG91 API Payload
    url = "https://control.msg91.com/api/v5/email/send"
    
    # Extract domain from from_email if domain is not set explicitly
    if not email_domain and "@" in email_from:
        email_domain = email_from.split("@")[1]
        
    payload = {
        "recipients": [
            {
                "to": [{"email": email}],
                "variables": {"otp": otp}
            }
        ],
        "from": {
            "email": email_from
        },
        "domain": email_domain,
        "template_id": msg91_otp_template_id
    }
    
    headers = {
        'accept': 'application/json',
        "Content-Type": "application/JSON",
        "authkey": auth_key
    }
    
    try:
        data = json.dumps(payload)
        response = requests.post('https://control.msg91.com/api/v5/email/send', headers=headers, data=data, timeout=10)
        logger.info(f"MSG91 Email API Response status: {response.status_code}, response: {response.text}")
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to send email OTP via MSG91 API: {str(e)}")
        # Print fallback to console so developers/users don't get locked out
        logger.info(f"\n============================================\n*** [FALLBACK MODE OTP] Send OTP to: {email} -> {otp} (Msg91 Error) ***\n============================================\n")
        return True


# --- AUTHENTICATION API ROUTES ---

@app.post("/api/auth/otp/request")
def request_otp(payload: schemas.OTPRequest, db: Session = Depends(get_db)):
    """Generate a 6-digit OTP and send it via email (Msg91)."""
    allowed_emails = backend_config.ALLOWED_EMAILS.split(',')
    if payload.email.lower() not in [email.strip().lower() for email in allowed_emails]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only the authorized manager can request authentication."
        )
        
    otp = f"{random.randint(100000, 999999)}"
    
    # Store OTP in DB
    crud.create_otp(db, email=payload.email, otp=otp)
    
    # Send email
    send_otp_email(payload.email, otp)
    
    return {"message": "OTP sent successfully"}


@app.post("/api/auth/otp/verify", response_model=schemas.Token)
def verify_otp(payload: schemas.OTPVerify, db: Session = Depends(get_db)):
    """Verify OTP and return a JWT access token."""
    allowed_emails = backend_config.ALLOWED_EMAILS.split(',')

    if payload.email.lower() not in [email.strip().lower() for email in allowed_emails]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only the authorized manager can verify authentication."
        )

    is_valid = crud.verify_otp(db, email=payload.email, otp=payload.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Create user if not exists (self-registration)
    db_user = crud.get_user_by_email(db, email=payload.email)
    if not db_user:
        db_user = crud.create_user(db, email=payload.email)
        
    # Generate token
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Return the authenticated user's profile info."""
    return current_user


# --- EMPLOYEE API ROUTES ---

@api_router.get("/api/employees", response_model=List[schemas.EmployeeOut])
def get_employees(active_only: bool = False, db: Session = Depends(get_db)):
    """Retrieve all employees registered in the system."""
    return crud.get_employees(db, active_only=active_only)

@api_router.post("/api/employees", response_model=schemas.EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    """Create a new employee profile with an alphanumeric ID."""
    db_emp = crud.get_employee_by_uuid(db, employee.employee_id)
    if db_emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID '{employee.employee_id}' is already registered."
        )
    return crud.create_employee(db, employee)

@api_router.put("/api/employees/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(employee_id: int, employee: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    """Update employee configuration parameters (hourly rate, name, status)."""
    db_emp = crud.update_employee(db, employee_id, employee)
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_emp


# --- ATTENDANCE LEDGER API ROUTES ---

@api_router.get("/api/attendance", response_model=List[schemas.AttendanceDetailOut])
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

@api_router.post("/api/attendance", response_model=schemas.AttendanceOut)
def log_attendance(attendance: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    """Record hours worked for an employee. Updates state to Present if hours > 0, else Absent."""
    return crud.log_attendance(db, attendance)

@api_router.post("/api/attendance/{attendance_id}/extra-work", response_model=schemas.ExtraWorkOut)
def add_extra_work(attendance_id: int, extra_work: schemas.ExtraWorkCreate, db: Session = Depends(get_db)):
    """Append a flat-rate task extension (Husk Packing, Rice Delivery, Paddy, Custom) to a present log."""
    return crud.create_extra_work(db, attendance_id, extra_work)

@api_router.delete("/api/attendance/extra-work/{extra_work_id}")
def delete_extra_work(extra_work_id: int, db: Session = Depends(get_db)):
    """Remove an extra work task allocation."""
    crud.delete_extra_work(db, extra_work_id)
    return {"message": "Extra work record removed successfully"}


# --- CASH ADVANCE API ROUTES ---

@api_router.get("/api/advances", response_model=List[schemas.CashAdvanceDetailOut])
def get_advances(month: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    """Retrieve all cash advances issued during the active calendar cycle."""
    return crud.get_advances_by_month(db, month)

@api_router.post("/api/advances", response_model=schemas.CashAdvanceOut)
def create_cash_advance(advance: schemas.CashAdvanceCreate, db: Session = Depends(get_db)):
    """Record a cash loan or payroll advance."""
    return crud.create_cash_advance(db, advance)

@api_router.delete("/api/advances/{advance_id}")
def delete_cash_advance(advance_id: int, db: Session = Depends(get_db)):
    """Void a cash advance record."""
    crud.delete_cash_advance(db, advance_id)
    return {"message": "Cash advance record voided successfully"}


# --- PAYROLL CYCLE & LOCKING API ROUTES ---

@api_router.get("/api/cycles", response_model=List[schemas.PayrollCycleOut])
def get_cycles(db: Session = Depends(get_db)):
    """Get all payroll cycles and lock states."""
    return db.query(models.PayrollCycle).all()

@api_router.get("/api/cycles/{month}", response_model=schemas.PayrollCycleOut)
def get_cycle(month: str, db: Session = Depends(get_db)):
    """Check lock status of a specific calendar month cycle."""
    cycle = crud.get_payroll_cycle(db, month)
    if not cycle:
        return schemas.PayrollCycleOut(month=month, id=0, is_locked=False, locked_at=None)
    return cycle

@api_router.post("/api/cycles/lock", response_model=schemas.PayrollCycleOut)
def lock_payroll_cycle(lock_data: schemas.PayrollCycleLock, db: Session = Depends(get_db)):
    """Hard-lock a monthly cycle. All entries within this month become immutable."""
    return crud.create_or_lock_payroll_cycle(db, lock_data.month)


# --- REPORTING & EXPORT API ROUTES ---

@api_router.get("/api/reports/summary", response_model=schemas.MonthlySummaryResponse)
def get_monthly_summary(month: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    """Compile aggregated payroll data metrics for a calendar month."""
    return crud.get_monthly_summary(db, month)

@api_router.get("/api/reports/excel")
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

@api_router.get("/api/reports/pdf")
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


@api_router.get("/api/employees/{employee_id}/attendance", response_model=schemas.EmployeeMonthlyReportResponse)
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


@api_router.get("/api/employees/{employee_id}/attendance/excel")
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


@api_router.get("/api/employees/{employee_id}/attendance/pdf")
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

@api_router.get("/api/audit-logs", response_model=List[schemas.AuditLogOut])
def get_audit_logs(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    """Retrieve database mutation audit logs."""
    return crud.get_audit_logs(db, skip=skip, limit=limit)

@api_router.delete("/api/audit-logs")
def clear_audit_logs(db: Session = Depends(get_db)):
    """Clear all database mutation audit logs."""
    crud.clear_audit_logs(db)
    return {"message": "Audit logs cleared successfully"}


# --- PADDY SUPPLIER & PROCUREMENT API ROUTES ---

@api_router.get("/api/paddy/suppliers", response_model=List[schemas.PaddySupplierDetailOut])
def get_paddy_suppliers(db: Session = Depends(get_db)):
    """Retrieve all registered paddy suppliers."""
    return crud.get_paddy_suppliers(db)

@api_router.get("/api/paddy/suppliers/{supplier_id}", response_model=schemas.PaddySupplierDetailOut)
def get_paddy_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific paddy supplier, including deliveries."""
    db_supplier = crud.get_paddy_supplier(db, supplier_id)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return db_supplier

@api_router.post("/api/paddy/suppliers", response_model=schemas.PaddySupplierOut, status_code=status.HTTP_201_CREATED)
def create_paddy_supplier(supplier: schemas.PaddySupplierCreate, db: Session = Depends(get_db)):
    """Register a new paddy supplier."""
    return crud.create_paddy_supplier(db, supplier)

@api_router.put("/api/paddy/suppliers/{supplier_id}", response_model=schemas.PaddySupplierOut)
def update_paddy_supplier(supplier_id: int, supplier: schemas.PaddySupplierUpdate, db: Session = Depends(get_db)):
    """Update details of a registered paddy supplier."""
    db_supplier = crud.update_paddy_supplier(db, supplier_id, supplier)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return db_supplier

@api_router.delete("/api/paddy/suppliers/{supplier_id}")
def delete_paddy_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Deregister a paddy supplier and remove their profile."""
    success = crud.delete_paddy_supplier(db, supplier_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deregistered successfully"}

@api_router.post("/api/paddy/suppliers/{supplier_id}/deliveries", response_model=schemas.PaddyDeliveryOut, status_code=status.HTTP_201_CREATED)
def create_paddy_delivery(supplier_id: int, delivery: schemas.PaddyDeliveryCreate, db: Session = Depends(get_db)):
    """Log a seasonal crop delivery for a supplier (quantity-only)."""
    return crud.create_paddy_delivery(db, supplier_id, delivery)

@api_router.delete("/api/paddy/deliveries/{delivery_id}")
def delete_paddy_delivery(delivery_id: int, db: Session = Depends(get_db)):
    """Void or remove a recorded paddy crop delivery."""
    crud.delete_paddy_delivery(db, delivery_id)
    return {"message": "Delivery record removed successfully"}

@api_router.get("/api/paddy/analytics", response_model=schemas.PaddyProcurementAnalytics)
def get_paddy_procurement_analytics(db: Session = Depends(get_db)):
    """Compile real-time total volume statistics for the active year."""
    return crud.get_paddy_procurement_analytics(db)

@api_router.get("/api/paddy/suppliers/{supplier_id}/yoy", response_model=schemas.PaddySupplierYoYReport)
def get_paddy_supplier_yoy_report(supplier_id: int, db: Session = Depends(get_db)):
    """Generate the Year-over-Year Historical Comparison and Trend report for a supplier."""
    return crud.get_paddy_supplier_yoy_report(db, supplier_id)

app.include_router(api_router)

