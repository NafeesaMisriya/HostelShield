import re
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator

GOV_ID_PATTERNS = {
    "AADHAAR": r"^\d{12}$",
    "PAN": r"^[A-Z]{5}\d{4}[A-Z]$",
    "PASSPORT": r"^[A-Z]{1}\d{7}$",
    "DL": r"^[A-Z]{2}\d{2}\s?\d{11}$",
}

def validate_gov_id(id_type: str, id_number: str) -> bool:
    pattern = GOV_ID_PATTERNS.get(id_type.upper() if id_type else "")
    if not pattern:
        return False
    return bool(re.match(pattern, id_number.strip().upper()))


def validate_indian_phone(phone: str) -> str:
    v_clean = phone.strip()
    if not re.match(r"^[6-9]\d{9}$", v_clean):
        raise ValueError("Phone number must be a valid 10-digit mobile number without symbols or spaces.")
    return v_clean


class PhoneValidationMixin(BaseModel):
    phone: str

    @field_validator("phone")
    def validate_phone(cls, v):
        return validate_indian_phone(v)


# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class StudentRegisterRequest(PhoneValidationMixin):
    full_name: str
    email: EmailStr
    password: str
    room_no: str
    hostel_block: Optional[str] = "Block A"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_available: Optional[bool] = True
    is_approved: Optional[bool] = True
    room_no: Optional[str] = None
    hostel_block: Optional[str] = None

    class Config:
        from_attributes = True

class UserPublic(BaseModel):
    id: int
    full_name: str
    room_no: Optional[str] = None
    hostel_block: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True


# Visitor Schemas
class VisitorCreate(PhoneValidationMixin):
    full_name: str
    gov_id_type: str
    gov_id_number: str

    @field_validator("gov_id_type")
    def validate_type(cls, v):
        allowed = ["AADHAAR", "PAN", "PASSPORT", "DL"]
        if v.upper() not in allowed:
            raise ValueError(f"gov_id_type must be one of {allowed}")
        return v.upper()

class VisitorTrackRequest(PhoneValidationMixin):
    full_name: str

class VisitorOut(BaseModel):
    id: int
    full_name: str
    phone: str
    gov_id_type: str
    gov_id_number: str

    class Config:
        from_attributes = True

class VisitorTrackPassResponse(BaseModel):
    id: int
    status: str  # PENDING, APPROVED, REJECTED, CHECKED_IN, OVERSTAYED
    pass_code: Optional[str] = None
    visitor_name: str
    visitor_phone: str
    gov_id_type: str
    gov_id_number: str
    student_name: str
    student_room: str
    student_block: str
    purpose: str
    expected_duration_minutes: int
    requested_at: datetime
    responded_at: Optional[datetime] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None

class PublicStatsResponse(BaseModel):
    active_inside: int
    today_verified: int
    gate_status: str = "ONLINE"



# Request Schemas
class PublicVisitorRequestCreate(BaseModel):
    visitor: VisitorCreate
    student_id: int
    purpose: str
    expected_duration_minutes: Optional[int] = 240

    @field_validator("visitor")
    def validate_visitor_gov_id(cls, v):
        if not validate_gov_id(v.gov_id_type, v.gov_id_number):
            raise ValueError(f"Invalid format for {v.gov_id_type}. Expected pattern matching standard official Indian Gov ID format.")
        return v

class VisitorRequestOut(BaseModel):
    id: int
    visitor_id: int
    student_id: int
    purpose: str
    status: str
    pass_code: Optional[str] = None
    expected_duration_minutes: int
    requested_at: datetime
    responded_at: Optional[datetime] = None
    visitor: VisitorOut
    student: UserOut
    check_log: Optional["CheckLogOut"] = None

    class Config:
        from_attributes = True


# CheckLog Schemas
class SecurityCheckInRequest(BaseModel):
    pass_code: str
    gov_id_verified: Optional[bool] = True
    override_student_unavailable: Optional[bool] = False
    override_note: Optional[str] = None

class SecurityCheckOutRequest(BaseModel):
    pass_code: str

class CheckLogOut(BaseModel):
    id: int
    request_id: int
    visitor_id: int
    verified_by_security_id: int
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    gov_doc_status: str
    security_note: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_overstayed: Optional[bool] = False

    class Config:
        from_attributes = True

class SecurityLookupResponse(BaseModel):
    request: VisitorRequestOut
    student_available: bool
    student_room: Optional[str]
    student_block: Optional[str]
    has_active_checkin: bool
    can_checkin: bool
    can_checkout: bool
    current_checklog: Optional[CheckLogOut] = None

class ActiveVisitorOut(BaseModel):
    check_log_id: int
    request_id: int
    pass_code: Optional[str]
    visitor_name: str
    visitor_phone: str
    gov_id_type: str
    gov_id_number: str
    student_name: str
    student_room: Optional[str]
    student_block: Optional[str]
    student_available: bool
    purpose: str
    check_in_time: datetime
    expected_duration_minutes: int
    duration_minutes: int
    is_overstayed: bool
    security_note: Optional[str]

class AdminStatsResponse(BaseModel):
    total_requests_today: int
    currently_inside: int
    total_overstays_today: int
    pending_approvals: int
    pending_student_registrations: int

class EmergencyBroadcastRequest(BaseModel):
    title: Optional[str] = "🚨 EMERGENCY BROADCAST ALERT"
    message: str

class AvailabilityUpdate(BaseModel):
    is_available: bool

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    target_role: Optional[str]
    type: Optional[str] = "INFO"
    created_at: datetime

    class Config:
        from_attributes = True
