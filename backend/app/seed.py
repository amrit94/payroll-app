import os
import sys
from datetime import date
from .database import SessionLocal
from . import models

def seed_database():
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
