from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..core.security import get_current_user
from .. import schemas, crud

router = APIRouter(
    prefix="/api/advances",
    tags=["Advances"],
    dependencies=[Depends(get_current_user)]
)

@router.get("", response_model=List[schemas.CashAdvanceDetailOut])
def get_advances(month: str = Query(..., description="Format YYYY-MM"), db: Session = Depends(get_db)):
    """Retrieve all cash advances issued during the active calendar cycle."""
    return crud.get_advances_by_month(db, month)

@router.post("", response_model=schemas.CashAdvanceOut)
def create_cash_advance(advance: schemas.CashAdvanceCreate, db: Session = Depends(get_db)):
    """Record a cash loan or payroll advance."""
    return crud.create_cash_advance(db, advance)

@router.delete("/{advance_id}")
def delete_cash_advance(advance_id: int, db: Session = Depends(get_db)):
    """Void a cash advance record."""
    crud.delete_cash_advance(db, advance_id)
    return {"message": "Cash advance record voided successfully"}
