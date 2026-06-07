from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..core.security import get_current_user
from .. import schemas, models, crud

router = APIRouter(
    prefix="/api/attendance",
    tags=["Attendance"],
    dependencies=[Depends(get_current_user)]
)

@router.get("", response_model=List[schemas.AttendanceDetailOut])
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

@router.post("", response_model=schemas.AttendanceOut)
def log_attendance(attendance: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    """Record hours worked for an employee. Updates state to Present if hours > 0, else Absent."""
    return crud.log_attendance(db, attendance)

@router.post("/{attendance_id}/extra-work", response_model=schemas.ExtraWorkOut)
def add_extra_work(attendance_id: int, extra_work: schemas.ExtraWorkCreate, db: Session = Depends(get_db)):
    """Append a flat-rate task extension (Husk Packing, Rice Delivery, Paddy, Custom) to a present log."""
    return crud.create_extra_work(db, attendance_id, extra_work)

@router.delete("/extra-work/{extra_work_id}")
def delete_extra_work(extra_work_id: int, db: Session = Depends(get_db)):
    """Remove an extra work task allocation."""
    crud.delete_extra_work(db, extra_work_id)
    return {"message": "Extra work record removed successfully"}
