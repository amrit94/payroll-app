from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..core.security import get_current_user
from .. import schemas, crud

router = APIRouter(
    prefix="/api/audit-logs",
    tags=["Audit Logs"],
    dependencies=[Depends(get_current_user)]
)

@router.get("", response_model=List[schemas.AuditLogOut])
def get_audit_logs(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    """Retrieve database mutation audit logs."""
    return crud.get_audit_logs(db, skip=skip, limit=limit)

@router.delete("")
def clear_audit_logs(db: Session = Depends(get_db)):
    """Clear all database mutation audit logs."""
    crud.clear_audit_logs(db)
    return {"message": "Audit logs cleared successfully"}
