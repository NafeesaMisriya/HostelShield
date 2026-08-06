import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, CheckLog, VisitorRequest, Visitor, SystemNotification
from ..schemas import ActiveVisitorOut, AdminStatsResponse, UserOut, EmergencyBroadcastRequest
from ..deps import require_role

router = APIRouter(prefix="/admin", tags=["Admin Dashboard Workflow"])


def compute_active_row(log: CheckLog) -> ActiveVisitorOut:
    now = datetime.datetime.utcnow()
    duration_mins = int((now - log.check_in_time).total_seconds() / 60)
    request = log.request
    expected_mins = request.expected_duration_minutes if request else 240
    is_overstayed = duration_mins > expected_mins

    visitor = log.visitor
    student = request.student if request else None

    return ActiveVisitorOut(
        check_log_id=log.id,
        request_id=request.id if request else 0,
        pass_code=request.pass_code if request else None,
        visitor_name=visitor.full_name if visitor else "Unknown",
        visitor_phone=visitor.phone if visitor else "N/A",
        gov_id_type=visitor.gov_id_type if visitor else "N/A",
        gov_id_number=visitor.gov_id_number if visitor else "N/A",
        student_name=student.full_name if student else "N/A",
        student_room=student.room_no if student else "N/A",
        student_block=student.hostel_block if student else "N/A",
        student_available=student.is_available if student else False,
        purpose=request.purpose if request else "N/A",
        check_in_time=log.check_in_time,
        expected_duration_minutes=expected_mins,
        duration_minutes=duration_mins,
        is_overstayed=is_overstayed,
        security_note=log.security_note
    )

@router.get("/pending-students", response_model=List[UserOut])
def get_pending_students(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Fetch all registered students whose accounts are awaiting admin approval"""
    pending = db.query(User).filter(User.role == "STUDENT", User.is_approved == False).all()
    return pending

@router.patch("/approve-student/{student_id}")
def approve_student(
    student_id: int,
    action: str = Query("approve", description="approve or reject"),
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    student = db.query(User).filter(User.id == student_id, User.role == "STUDENT").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student user not found")

    if action.lower() == "approve":
        student.is_approved = True
        db.commit()
        return {"message": f"Student {student.full_name} account approved successfully", "is_approved": True}
    elif action.lower() == "reject":
        db.delete(student)
        db.commit()
        return {"message": f"Student registration rejected and account removed", "is_approved": False}
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")

@router.get("/active", response_model=List[ActiveVisitorOut])
def get_active_visitors(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Emergency list of all visitors currently inside the hostel premises"""
    active_logs = (
        db.query(CheckLog)
        .filter(CheckLog.check_out_time.is_(None))
        .order_by(CheckLog.check_in_time.desc())
        .all()
    )
    return [compute_active_row(log) for log in active_logs]

@router.get("/overstays", response_model=List[ActiveVisitorOut])
def get_overstaying_visitors(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """List of active visitors who have exceeded their stay duration"""
    active_logs = (
        db.query(CheckLog)
        .filter(CheckLog.check_out_time.is_(None))
        .all()
    )
    overstays = []
    for log in active_logs:
        row = compute_active_row(log)
        if row.is_overstayed:
            overstays.append(row)
    return overstays

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_today = db.query(VisitorRequest).filter(VisitorRequest.requested_at >= today_start).count()
    inside = db.query(CheckLog).filter(CheckLog.check_out_time.is_(None)).count()
    pending_vis = db.query(VisitorRequest).filter(VisitorRequest.status == "PENDING").count()
    pending_stu = db.query(User).filter(User.role == "STUDENT", User.is_approved == False).count()

    active_logs = db.query(CheckLog).filter(CheckLog.check_out_time.is_(None)).all()
    overstays_count = 0
    for log in active_logs:
        row = compute_active_row(log)
        if row.is_overstayed:
            overstays_count += 1

    return AdminStatsResponse(
        total_requests_today=total_today,
        currently_inside=inside,
        total_overstays_today=overstays_count,
        pending_approvals=pending_vis,
        pending_student_registrations=pending_stu
    )

@router.get("/reports")
def get_reports(
    period: Optional[str] = Query("all", description="daily, monthly, custom, or all"),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(CheckLog)
    now = datetime.datetime.utcnow()

    if period == "daily":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(CheckLog.check_in_time >= start_of_day)
    elif period == "monthly":
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(CheckLog.check_in_time >= start_of_month)
    elif period == "custom":
        if from_date:
            try:
                dt_from = datetime.datetime.fromisoformat(from_date)
                query = query.filter(CheckLog.check_in_time >= dt_from)
            except ValueError:
                pass
        if to_date:
            try:
                dt_to = datetime.datetime.fromisoformat(to_date) + datetime.timedelta(days=1)
                query = query.filter(CheckLog.check_in_time <= dt_to)
            except ValueError:
                pass

    logs = query.order_by(CheckLog.check_in_time.desc()).all()
    
    results = []
    for log in logs:
        check_out = log.check_out_time or now
        duration_mins = int((check_out - log.check_in_time).total_seconds() / 60)
        exp_duration = log.request.expected_duration_minutes if log.request else 240

        results.append({
            "id": log.id,
            "pass_code": log.request.pass_code if log.request else None,
            "visitor_name": log.visitor.full_name if log.visitor else "N/A",
            "visitor_phone": log.visitor.phone if log.visitor else "N/A",
            "gov_id_type": log.visitor.gov_id_type if log.visitor else "N/A",
            "gov_id_number": log.visitor.gov_id_number if log.visitor else "N/A",
            "student_name": log.request.student.full_name if (log.request and log.request.student) else "N/A",
            "room_no": log.request.student.room_no if (log.request and log.request.student) else "N/A",
            "hostel_block": log.request.student.hostel_block if (log.request and log.request.student) else "N/A",
            "purpose": log.request.purpose if log.request else "N/A",
            "check_in_time": log.check_in_time.isoformat(),
            "check_out_time": log.check_out_time.isoformat() if log.check_out_time else None,
            "duration_minutes": duration_mins,
            "expected_duration_minutes": exp_duration,
            "is_overstayed": duration_mins > exp_duration,
            "gov_doc_status": log.gov_doc_status,
            "security_note": log.security_note,
            "status": "COMPLETED" if log.check_out_time else "ACTIVE"
        })

    # Aggregates
    total_entries = len(results)
    completed_exits = len([r for r in results if r["status"] == "COMPLETED"])
    overstay_count = len([r for r in results if r["is_overstayed"]])

    return {
        "period": period,
        "summary": {
            "total_entries": total_entries,
            "completed_exits": completed_exits,
            "active_inside": total_entries - completed_exits,
            "overstay_count": overstay_count
        },
        "logs": results
    }

@router.post("/force-checkout/{check_log_id}")
def force_checkout(
    check_log_id: int,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    log = db.query(CheckLog).filter(CheckLog.id == check_log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Check log record not found")

    if log.check_out_time is not None:
        raise HTTPException(status_code=400, detail="Visitor is already checked out")

    log.check_out_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(log)
    return {"message": "Visitor force checked out successfully", "check_log_id": log.id}


@router.post("/broadcast-emergency")
def broadcast_emergency(
    payload: EmergencyBroadcastRequest,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Dispatches a 1-click emergency alert to all residents and security personnel"""
    notif = SystemNotification(
        recipient_id=None,
        target_role=None,
        title=payload.title or "🚨 EMERGENCY BROADCAST ALERT",
        message=payload.message.strip(),
        is_read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return {
        "message": "Emergency alert broadcasted successfully to all hostel residents and security desk.",
        "notification_id": notif.id
    }

