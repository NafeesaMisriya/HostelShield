import datetime
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import User, Visitor, VisitorRequest, CheckLog
from .auth import get_password_hash

def seed_data():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Users
        users_def = [
            {
                "email": "student1@hostel.com",
                "full_name": "Aarav Sharma",
                "phone": "9876543201",
                "role": "STUDENT",
                "room_no": "101-A",
                "hostel_block": "Block A",
                "is_available": True,
                "is_approved": True  # Approved student
            },
            {
                "email": "student2@hostel.com",
                "full_name": "Ananya Verma",
                "phone": "9876543202",
                "role": "STUDENT",
                "room_no": "102-B",
                "hostel_block": "Block B",
                "is_available": False,
                "is_approved": True  # Approved student (Unavailable)
            },
            {
                "email": "newstudent@hostel.com",
                "full_name": "Rohan Patel (New Student)",
                "phone": "9876543203",
                "role": "STUDENT",
                "room_no": "205-C",
                "hostel_block": "Block C",
                "is_available": True,
                "is_approved": False  # Unapproved Student (Pending Registration Approval)
            },
            {
                "email": "security@hostel.com",
                "full_name": "Vikram Singh (Gate 1 Guard)",
                "phone": "9876543299",
                "role": "SECURITY",
                "room_no": None,
                "hostel_block": None,
                "is_available": True,
                "is_approved": True
            },
            {
                "email": "admin@hostel.com",
                "full_name": "Dr. Rajesh Gupta (Warden)",
                "phone": "9876543200",
                "role": "ADMIN",
                "room_no": None,
                "hostel_block": None,
                "is_available": True,
                "is_approved": True
            }
        ]

        created_users = {}
        for u in users_def:
            user = db.query(User).filter(User.email == u["email"]).first()
            if not user:
                user = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    phone=u["phone"],
                    hashed_password=get_password_hash("password123"),
                    role=u["role"],
                    room_no=u["room_no"],
                    hostel_block=u["hostel_block"],
                    is_available=u["is_available"],
                    is_approved=u["is_approved"]
                )
                db.add(user)
                db.flush()
            created_users[u["email"]] = user

        student1 = created_users["student1@hostel.com"]
        student2 = created_users["student2@hostel.com"]
        security = created_users["security@hostel.com"]

        # 2. Visitors
        visitors_def = [
            {
                "full_name": "Rahul Kumar",
                "phone": "9876543210",
                "gov_id_type": "AADHAAR",
                "gov_id_number": "123456789012"
            },
            {
                "full_name": "Priya Nair",
                "phone": "9812345678",
                "gov_id_type": "PAN",
                "gov_id_number": "ABCDE1234F"
            },
            {
                "full_name": "Sunita Gupta",
                "phone": "9988776655",
                "gov_id_type": "DL",
                "gov_id_number": "DL0120201234567"
            }
        ]

        created_visitors = []
        for v in visitors_def:
            vis = db.query(Visitor).filter(
                Visitor.phone == v["phone"],
                Visitor.gov_id_number == v["gov_id_number"]
            ).first()
            if not vis:
                vis = Visitor(
                    full_name=v["full_name"],
                    phone=v["phone"],
                    gov_id_type=v["gov_id_type"],
                    gov_id_number=v["gov_id_number"]
                )
                db.add(vis)
                db.flush()
            created_visitors.append(vis)

        v_rahul = created_visitors[0]
        v_priya = created_visitors[1]
        v_sunita = created_visitors[2]

        now = datetime.datetime.utcnow()

        # 3. Requests & CheckLogs
        req1 = db.query(VisitorRequest).filter(VisitorRequest.pass_code == "PASS01").first()
        if not req1:
            req1 = VisitorRequest(
                visitor_id=v_rahul.id,
                student_id=student1.id,
                purpose="Delivering study materials & laptop charger",
                status="PENDING",
                pass_code=None,
                expected_duration_minutes=240,
                requested_at=now - datetime.timedelta(minutes=15)
            )
            db.add(req1)
            db.flush()

        req2 = db.query(VisitorRequest).filter(VisitorRequest.pass_code == "PASS02").first()
        if not req2:
            req2 = VisitorRequest(
                visitor_id=v_priya.id,
                student_id=student1.id,
                purpose="Family visit & snack delivery",
                status="APPROVED",
                pass_code="PASS02",
                expected_duration_minutes=240,
                requested_at=now - datetime.timedelta(hours=1),
                responded_at=now - datetime.timedelta(minutes=45)
            )
            db.add(req2)
            db.flush()

            log2 = CheckLog(
                request_id=req2.id,
                visitor_id=v_priya.id,
                verified_by_security_id=security.id,
                check_in_time=now - datetime.timedelta(minutes=30),
                check_out_time=None,
                gov_doc_status="VERIFIED"
            )
            db.add(log2)

        req3 = db.query(VisitorRequest).filter(VisitorRequest.pass_code == "PASS03").first()
        if not req3:
            req3 = VisitorRequest(
                visitor_id=v_sunita.id,
                student_id=student2.id,
                purpose="Urgent family discussion",
                status="APPROVED",
                pass_code="PASS03",
                expected_duration_minutes=240,
                requested_at=now - datetime.timedelta(hours=6),
                responded_at=now - datetime.timedelta(hours=5, minutes=30)
            )
            db.add(req3)
            db.flush()

            log3 = CheckLog(
                request_id=req3.id,
                visitor_id=v_sunita.id,
                verified_by_security_id=security.id,
                check_in_time=now - datetime.timedelta(minutes=300),
                check_out_time=None,
                gov_doc_status="OVERRIDDEN",
                security_note="Host student was unavailable. Verified parent physically."
            )
            db.add(log3)

        db.commit()
        print("[SUCCESS] Database successfully seeded with demo accounts and visitors!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
