import os
import sys
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Resolve backend directory in search path to import config module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import config as backend_config

from ..database import get_db
from ..core.security import get_current_user, create_access_token
from ..services.msg91 import send_otp_email
from .. import schemas, models, crud

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/otp/request")
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


@router.post("/otp/verify", response_model=schemas.Token)
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


@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Return the authenticated user's profile info."""
    return current_user
