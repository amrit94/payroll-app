import calendar
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..core.security import get_current_user
from .. import schemas, models, crud, report_generator

router = APIRouter(
    tags=["Reports"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/api/reports/summary", response_model=schemas.MonthlySummaryResponse)
def get_monthly_summary(month: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    """Compile aggregated payroll data metrics for a calendar month."""
    return crud.get_monthly_summary(db, month)

@router.get("/api/reports/excel")
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

@router.get("/api/reports/pdf")
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


@router.get("/api/employees/{employee_id}/attendance", response_model=schemas.EmployeeMonthlyReportResponse)
def get_employee_monthly_attendance_report(
    employee_id: int, 
    month: str = Query(..., description="Format YYYY-MM"), 
    db: Session = Depends(get_db)
):
    """Retrieve daily attendance, extra work, and advances for an employee over a specific month."""
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


@router.get("/api/employees/{employee_id}/attendance/excel")
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


@router.get("/api/employees/{employee_id}/attendance/pdf")
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
