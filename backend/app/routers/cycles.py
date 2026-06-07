from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..core.security import get_current_user
from .. import schemas, models, crud

router = APIRouter(
    prefix="/api/cycles",
    tags=["Cycles"],
    dependencies=[Depends(get_current_user)]
)

@router.get("", response_model=List[schemas.PayrollCycleOut])
def get_cycles(db: Session = Depends(get_db)):
    """Get all payroll cycles and lock states."""
    return db.query(models.PayrollCycle).all()

@router.get("/{month}", response_model=schemas.PayrollCycleOut)
def get_cycle(month: str, db: Session = Depends(get_db)):
    """Check lock status of a specific calendar month cycle."""
    cycle = crud.get_payroll_cycle(db, month)
    if not cycle:
        return schemas.PayrollCycleOut(month=month, id=0, is_locked=False, locked_at=None)
    return cycle

@router.post("/lock", response_model=schemas.PayrollCycleOut)
def lock_payroll_cycle(lock_data: schemas.PayrollCycleLock, db: Session = Depends(get_db)):
    """Hard-lock a monthly cycle. All entries within this month become immutable."""
    return crud.create_or_lock_payroll_cycle(db, lock_data.month)
