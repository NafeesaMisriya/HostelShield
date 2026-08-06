import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, VisitorRequest, CheckLog, SystemNotification
from ..schemas import NotificationOut
from ..deps import get_current_user, require_role

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])

@router.post("/trigger-overstay/{request_id}", response_model=NotificationOut)
def trigger_overstay_notification(
    request_id: int,
    current_user: User = Depends(require_role(["ADMIN", "SECURITY"])),
    db: Session = Depends(get_db)
):
    req = db.query(VisitorRequest).filter(VisitorRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Visitor request not found")

    log = db.query(CheckLog).filter(CheckLog.request_id == req.id, CheckLog.check_out_time.is_(None)).first()
    if not log:
        raise HTTPException(status_code=400, detail="Visitor is not currently inside premises")

    visitor_name = req.visitor.full_name if req.visitor else "Visitor"
    student = req.student
    room = student.room_no if student else "N/A"
    duration = int((datetime.datetime.utcnow() - log.check_in_time).total_seconds() / 60)

    title = f"⚠️ OVERSTAY ALERT: {visitor_name}"
    msg = f"Visitor {visitor_name} (Passcode: {req.pass_code or 'N/A'}) visiting host student {student.full_name if student else 'N/A'} (Room {room}) has exceeded stay limit ({duration} mins inside)."

    notif = SystemNotification(
        recipient_id=student.id if student else None,
        target_role="STUDENT",
        title=title,
        message=msg,
        is_read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    return notif

@router.get("", response_model=List[NotificationOut])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = (
        db.query(SystemNotification)
        .filter(
            (SystemNotification.recipient_id == current_user.id) |
            (SystemNotification.target_role == current_user.role)
        )
        .order_by(SystemNotification.created_at.desc())
        .limit(20)
        .all()
    )
    return notifs
