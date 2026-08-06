import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, VisitorRequest, CheckLog
from ..schemas import (
    SecurityLookupResponse,
    SecurityCheckInRequest,
    SecurityCheckOutRequest,
    CheckLogOut
)
from ..deps import require_role

router = APIRouter(prefix="/security", tags=["Security Desk Workflow"])

def compute_checklog_fields(log: CheckLog) -> CheckLogOut:
    now = datetime.datetime.utcnow()
    check_in = log.check_in_time
    check_out = log.check_out_time or now
    duration_mins = int((check_out - check_in).total_seconds() / 60)
    exp_mins = log.request.expected_duration_minutes if log.request else 240
    is_overstayed = duration_mins > exp_mins
    
    res = CheckLogOut.model_validate(log)
    res.duration_minutes = duration_mins
    res.is_overstayed = is_overstayed
    return res

@router.get("/lookup/{pass_code}", response_model=SecurityLookupResponse)
def lookup_passcode(
    pass_code: str,
    current_user: User = Depends(require_role(["SECURITY", "ADMIN"])),
    db: Session = Depends(get_db)
):
    code_clean = pass_code.strip().upper()
    req = db.query(VisitorRequest).filter(VisitorRequest.pass_code == code_clean).first()
    if not req:
        raise HTTPException(status_code=404, detail=f"Pass code '{code_clean}' not found or invalid.")

    student = req.student
    active_checklog = (
        db.query(CheckLog)
        .filter(CheckLog.request_id == req.id, CheckLog.check_out_time.is_(None))
        .first()
    )

    can_checkin = (req.status == "APPROVED") and (active_checklog is None)
    can_checkout = active_checklog is not None

    current_log_schema = compute_checklog_fields(active_checklog) if active_checklog else None

    return SecurityLookupResponse(
        request=req,
        student_available=student.is_available if student else False,
        student_room=student.room_no if student else None,
        student_block=student.hostel_block if student else None,
        has_active_checkin=active_checklog is not None,
        can_checkin=can_checkin,
        can_checkout=can_checkout,
        current_checklog=current_log_schema
    )

@router.post("/checkin", response_model=CheckLogOut)
def checkin_visitor(
    payload: SecurityCheckInRequest,
    current_user: User = Depends(require_role(["SECURITY", "ADMIN"])),
    db: Session = Depends(get_db)
):
    code_clean = payload.pass_code.strip().upper()
    req = db.query(VisitorRequest).filter(VisitorRequest.pass_code == code_clean).first()
    if not req:
        raise HTTPException(status_code=404, detail="Pass code not found")

    if req.status != "APPROVED":
        raise HTTPException(status_code=400, detail=f"Cannot check in. Pass status is {req.status}")

    # Edge Case 1: Check if visitor already checked in with open log (Double Check-In Prevention)
    existing_open_log = (
        db.query(CheckLog)
        .filter(CheckLog.visitor_id == req.visitor_id, CheckLog.check_out_time.is_(None))
        .first()
    )
    if existing_open_log:
        raise HTTPException(
            status_code=409,
            detail="409 Conflict: Visitor is already checked in with active session."
        )

    # Edge Case 2: Student unavailable warning check
    student = req.student
    doc_status = "VERIFIED"
    if student and not student.is_available:
        if not payload.override_student_unavailable and not payload.override_note:
            raise HTTPException(
                status_code=400,
                detail=f"⚠️ WARNING: Host student {student.full_name} (Room {student.room_no or 'N/A'}, Block {student.hostel_block or 'A'}) is currently UNAVAILABLE. Security desk override confirmation with note is required."
            )
        doc_status = "OVERRIDDEN"

    if payload.override_note:
        doc_status = "OVERRIDDEN"

    # Create CheckLog
    log = CheckLog(
        request_id=req.id,
        visitor_id=req.visitor_id,
        verified_by_security_id=current_user.id,
        check_in_time=datetime.datetime.utcnow(),
        check_out_time=None,
        gov_doc_status=doc_status,
        security_note=payload.override_note.strip() if payload.override_note else None
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return compute_checklog_fields(log)

@router.post("/checkout", response_model=CheckLogOut)
def checkout_visitor(
    payload: SecurityCheckOutRequest,
    current_user: User = Depends(require_role(["SECURITY", "ADMIN"])),
    db: Session = Depends(get_db)
):
    code_clean = payload.pass_code.strip().upper()
    req = db.query(VisitorRequest).filter(VisitorRequest.pass_code == code_clean).first()
    if not req:
        raise HTTPException(status_code=404, detail="Pass code not found")

    log = (
        db.query(CheckLog)
        .filter(CheckLog.request_id == req.id, CheckLog.check_out_time.is_(None))
        .first()
    )
    if not log:
        raise HTTPException(status_code=400, detail="No active check-in session found for this pass code")

    log.check_out_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(log)

    return compute_checklog_fields(log)
