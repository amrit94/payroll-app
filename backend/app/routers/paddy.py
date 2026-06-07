from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..core.security import get_current_user
from .. import schemas, crud

router = APIRouter(
    prefix="/api/paddy",
    tags=["Paddy Procurement"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/suppliers", response_model=List[schemas.PaddySupplierDetailOut])
def get_paddy_suppliers(db: Session = Depends(get_db)):
    """Retrieve all registered paddy suppliers."""
    return crud.get_paddy_suppliers(db)

@router.get("/suppliers/{supplier_id}", response_model=schemas.PaddySupplierDetailOut)
def get_paddy_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific paddy supplier, including deliveries."""
    db_supplier = crud.get_paddy_supplier(db, supplier_id)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return db_supplier

@router.post("/suppliers", response_model=schemas.PaddySupplierOut, status_code=status.HTTP_201_CREATED)
def create_paddy_supplier(supplier: schemas.PaddySupplierCreate, db: Session = Depends(get_db)):
    """Register a new paddy supplier."""
    return crud.create_paddy_supplier(db, supplier)

@router.put("/suppliers/{supplier_id}", response_model=schemas.PaddySupplierOut)
def update_paddy_supplier(supplier_id: int, supplier: schemas.PaddySupplierUpdate, db: Session = Depends(get_db)):
    """Update details of a registered paddy supplier."""
    db_supplier = crud.update_paddy_supplier(db, supplier_id, supplier)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return db_supplier

@router.delete("/suppliers/{supplier_id}")
def delete_paddy_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Deregister a paddy supplier and remove their profile."""
    success = crud.delete_paddy_supplier(db, supplier_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deregistered successfully"}

@router.post("/suppliers/{supplier_id}/deliveries", response_model=schemas.PaddyDeliveryOut, status_code=status.HTTP_201_CREATED)
def create_paddy_delivery(supplier_id: int, delivery: schemas.PaddyDeliveryCreate, db: Session = Depends(get_db)):
    """Log a seasonal crop delivery for a supplier (quantity-only)."""
    return crud.create_paddy_delivery(db, supplier_id, delivery)

@router.delete("/deliveries/{delivery_id}")
def delete_paddy_delivery(delivery_id: int, db: Session = Depends(get_db)):
    """Void or remove a recorded paddy crop delivery."""
    crud.delete_paddy_delivery(db, delivery_id)
    return {"message": "Delivery record removed successfully"}

@router.get("/analytics", response_model=schemas.PaddyProcurementAnalytics)
def get_paddy_procurement_analytics(db: Session = Depends(get_db)):
    """Compile real-time total volume statistics for the active year."""
    return crud.get_paddy_procurement_analytics(db)

@router.get("/suppliers/{supplier_id}/yoy", response_model=schemas.PaddySupplierYoYReport)
def get_paddy_supplier_yoy_report(supplier_id: int, db: Session = Depends(get_db)):
    """Generate the Year-over-Year Historical Comparison and Trend report for a supplier."""
    return crud.get_paddy_supplier_yoy_report(db, supplier_id)
