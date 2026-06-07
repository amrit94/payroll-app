from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..core.security import get_current_user
from .. import schemas, crud

router = APIRouter(
    prefix="/api/employees",
    tags=["Employees"],
    dependencies=[Depends(get_current_user)]
)

@router.get("", response_model=List[schemas.EmployeeOut])
def get_employees(active_only: bool = False, db: Session = Depends(get_db)):
    """Retrieve all employees registered in the system."""
    return crud.get_employees(db, active_only=active_only)

@router.post("", response_model=schemas.EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    """Create a new employee profile with an alphanumeric ID."""
    db_emp = crud.get_employee_by_uuid(db, employee.employee_id)
    if db_emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID '{employee.employee_id}' is already registered."
        )
    return crud.create_employee(db, employee)

@router.put("/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(employee_id: int, employee: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    """Update employee configuration parameters (hourly rate, name, status)."""
    db_emp = crud.update_employee(db, employee_id, employee)
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_emp
