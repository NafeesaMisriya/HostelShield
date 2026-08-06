import datetime
import random
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, VisitorRequest
from ..schemas import VisitorRequestOut, UserPublic, AvailabilityUpdate
from ..deps import get_current_user, require_role

router = APIRouter(prefix="", tags=["Student Workflow"])

def generate_pass_code(db: Session) -> str:
    for _ in range(10):
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        existing = db.query(VisitorRequest).filter(VisitorRequest.pass_code == code).first()
        if not existing:
            return code
    raise HTTPException(status_code=500, detail="Failed to generate unique pass code")

@router.get("/students/public", response_model=List[UserPublic])
def get_public_students(db: Session = Depends(get_db)):
    """Public endpoint for visitor request form student selection dropdown"""
    students = db.query(User).filter(User.role == "STUDENT").all()
    return students

@router.get("/students/me/requests", response_model=List[VisitorRequestOut])
def get_student_requests(
    current_user: User = Depends(require_role(["STUDENT"])),
    db: Session = Depends(get_db)
):
    requests = (
        db.query(VisitorRequest)
        .filter(VisitorRequest.student_id == current_user.id)
        .order_by(VisitorRequest.requested_at.desc())
        .all()
    )
    return requests

@router.patch("/requests/{request_id}/approve", response_model=VisitorRequestOut)
def approve_request(
    request_id: int,
    current_user: User = Depends(require_role(["STUDENT"])),
    db: Session = Depends(get_db)
):
    req = db.query(VisitorRequest).filter(VisitorRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Visitor request not found")
    if req.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to approve this request")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    pass_code = generate_pass_code(db)
    req.status = "APPROVED"
    req.pass_code = pass_code
    req.responded_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(req)
    return req

@router.patch("/requests/{request_id}/reject", response_model=VisitorRequestOut)
def reject_request(
    request_id: int,
    current_user: User = Depends(require_role(["STUDENT"])),
    db: Session = Depends(get_db)
):
    req = db.query(VisitorRequest).filter(VisitorRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Visitor request not found")
    if req.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this request")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    req.status = "REJECTED"
    req.responded_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(req)
    return req

@router.patch("/students/me/availability")
def toggle_availability(
    payload: AvailabilityUpdate,
    current_user: User = Depends(require_role(["STUDENT"])),
    db: Session = Depends(get_db)
):
    current_user.is_available = payload.is_available
    db.commit()
    db.refresh(current_user)
    return {"message": "Availability updated", "is_available": current_user.is_available}
