import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # ADMIN, SECURITY, STUDENT
    is_available = Column(Boolean, default=True)  # Student availability toggle
    is_approved = Column(Boolean, default=False)  # Requires Warden Approval for new registrations
    room_no = Column(String, nullable=True)  # Student room number
    hostel_block = Column(String, nullable=True)  # Student hostel block
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    student_requests = relationship("VisitorRequest", back_populates="student")
    security_check_logs = relationship("CheckLog", back_populates="security_user")


class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    gov_id_type = Column(String, nullable=False)  # AADHAAR, PAN, PASSPORT, DL
    gov_id_number = Column(String, nullable=False)

    requests = relationship("VisitorRequest", back_populates="visitor")
    check_logs = relationship("CheckLog", back_populates="visitor")


class VisitorRequest(Base):
    __tablename__ = "visitor_requests"

    id = Column(Integer, primary_key=True, index=True)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    purpose = Column(Text, nullable=False)
    status = Column(String, default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    pass_code = Column(String, unique=True, index=True, nullable=True)  # Pass code
    expected_duration_minutes = Column(Integer, default=120, nullable=False)
    requested_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    responded_at = Column(DateTime, nullable=True)

    visitor = relationship("Visitor", back_populates="requests")
    student = relationship("User", back_populates="student_requests")
    check_log = relationship("CheckLog", back_populates="request", uselist=False)


class CheckLog(Base):
    __tablename__ = "check_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("visitor_requests.id"), nullable=False)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=False)
    verified_by_security_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    check_in_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    check_out_time = Column(DateTime, nullable=True)
    gov_doc_status = Column(String, default="VERIFIED", nullable=False)  # VERIFIED, OVERRIDDEN
    security_note = Column(Text, nullable=True)

    request = relationship("VisitorRequest", back_populates="check_log")
    visitor = relationship("Visitor", back_populates="check_logs")
    security_user = relationship("User", back_populates="security_check_logs")


class SystemNotification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_role = Column(String, nullable=True)  # STUDENT, SECURITY, ADMIN
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Notification = SystemNotification

