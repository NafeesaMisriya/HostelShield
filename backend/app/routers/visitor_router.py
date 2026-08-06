import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Visitor, VisitorRequest, CheckLog
from ..schemas import PublicVisitorRequestCreate, VisitorRequestOut, VisitorTrackRequest, VisitorTrackPassResponse, PublicStatsResponse

router = APIRouter(tags=["Public Visitor Workflow"])

@router.post("/visitor/requests", response_model=VisitorRequestOut, status_code=status.HTTP_201_CREATED)
@router.post("/visitors/requests", response_model=VisitorRequestOut, status_code=status.HTTP_201_CREATED)
def create_visitor_request(
    payload: PublicVisitorRequestCreate,
    db: Session = Depends(get_db)
):
    # 1. Verify target student existence and availability
    student = db.query(User).filter(User.id == payload.student_id, User.role == "STUDENT").first()
    if not student:
        raise HTTPException(status_code=404, detail="Host student not found")
    if not student.is_available:
        raise HTTPException(
            status_code=400,
            detail=f"Student {student.full_name} (Room {student.room_no or 'N/A'}) is currently marked UNAVAILABLE to receive visitors."
        )

    # 2. Get or create Visitor record
    visitor_data = payload.visitor
    visitor = db.query(Visitor).filter(
        Visitor.phone == visitor_data.phone.strip(),
        Visitor.gov_id_type == visitor_data.gov_id_type,
        Visitor.gov_id_number == visitor_data.gov_id_number.strip().upper()
    ).first()

    if not visitor:
        visitor = Visitor(
            full_name=visitor_data.full_name.strip(),
            phone=visitor_data.phone.strip(),
            gov_id_type=visitor_data.gov_id_type,
            gov_id_number=visitor_data.gov_id_number.strip().upper()
        )
        db.add(visitor)
        db.flush()

    # 3. Duplicate check: Pending or Approved without check-in
    open_requests = db.query(VisitorRequest).filter(
        VisitorRequest.visitor_id == visitor.id,
        VisitorRequest.status.in_(["PENDING", "APPROVED"])
    ).all()

    for req in open_requests:
        if req.status == "PENDING":
            raise HTTPException(
                status_code=409,
                detail="Active request already exists for this visitor. Please wait for student response."
            )
        elif req.status == "APPROVED":
            check_log = db.query(CheckLog).filter(CheckLog.request_id == req.id).first()
            if not check_log or check_log.check_out_time is None:
                raise HTTPException(
                    status_code=409,
                    detail=f"Active request or pass (Passcode: {req.pass_code}) already exists for this visitor."
                )

    # 4. Create new VisitorRequest
    new_request = VisitorRequest(
        visitor_id=visitor.id,
        student_id=student.id,
        purpose=payload.purpose.strip(),
        expected_duration_minutes=payload.expected_duration_minutes or 120,
        status="PENDING",
        requested_at=datetime.datetime.utcnow()
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@router.post("/visitor/track-pass", response_model=VisitorTrackPassResponse)
@router.post("/visitors/track-pass", response_model=VisitorTrackPassResponse)
def track_visitor_pass(
    payload: VisitorTrackRequest,
    db: Session = Depends(get_db)
):
    """
    Public Endpoint for Visitors to check pass status & retrieve Pass Key
    Query Visitor joined with VisitorRequest by exact Name & Phone
    """
    clean_name = payload.full_name.strip()
    clean_phone = payload.phone.strip()

    # Find matching visitor
    visitors = db.query(Visitor).filter(Visitor.phone == clean_phone).all()
    matching_visitor = None
    for v in visitors:
        if v.full_name.strip().lower() == clean_name.lower():
            matching_visitor = v
            break

    if not matching_visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No visitor request found for the provided Name and Phone number. Please check details or submit a new request."
        )

    # Get latest request for this visitor
    latest_req = (
        db.query(VisitorRequest)
        .filter(VisitorRequest.visitor_id == matching_visitor.id)
        .order_by(VisitorRequest.requested_at.desc())
        .first()
    )

    if not latest_req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No visitor request found for the provided Name and Phone number. Please check details or submit a new request."
        )

    # Calculate status badge
    computed_status = latest_req.status
    check_in_time = None
    check_out_time = None

    if latest_req.check_log:
        check_in_time = latest_req.check_log.check_in_time
        check_out_time = latest_req.check_log.check_out_time
        if check_out_time is None:
            now = datetime.datetime.utcnow()
            duration_mins = int((now - check_in_time).total_seconds() / 60)
            if duration_mins > latest_req.expected_duration_minutes:
                computed_status = "OVERSTAYED"
            else:
                computed_status = "CHECKED_IN"
        else:
            computed_status = "CHECKED_OUT"

    student = latest_req.student
    formatted_pass_code = latest_req.pass_code
    if formatted_pass_code and not formatted_pass_code.startswith("PASS-"):
        formatted_pass_code = f"PASS-{formatted_pass_code}"

    return VisitorTrackPassResponse(
        id=latest_req.id,
        status=computed_status,
        pass_code=formatted_pass_code,
        visitor_name=matching_visitor.full_name,
        visitor_phone=matching_visitor.phone,
        gov_id_type=matching_visitor.gov_id_type,
        gov_id_number=matching_visitor.gov_id_number,
        student_name=student.full_name if student else "N/A",
        student_room=student.room_no if student else "N/A",
        student_block=student.hostel_block if student else "N/A",
        purpose=latest_req.purpose,
        expected_duration_minutes=latest_req.expected_duration_minutes,
        requested_at=latest_req.requested_at,
        responded_at=latest_req.responded_at,
        check_in_time=check_in_time,
        check_out_time=check_out_time
    )


@router.get("/visitor/public-stats", response_model=PublicStatsResponse)
@router.get("/visitors/public-stats", response_model=PublicStatsResponse)
def get_public_stats(db: Session = Depends(get_db)):
    """Live public system metrics counter for Landing Page"""
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    active_inside = db.query(CheckLog).filter(CheckLog.check_out_time.is_(None)).count()
    today_verified = db.query(CheckLog).filter(CheckLog.check_in_time >= today_start).count()

    return PublicStatsResponse(
        active_inside=active_inside,
        today_verified=today_verified,
        gate_status="ONLINE"
    )

