from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, StudentRegisterRequest, TokenResponse, UserOut
from ..auth import verify_password, get_password_hash, create_access_token
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register-student", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_student(payload: StudentRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email already registered"
        )

    new_student = User(
        full_name=payload.full_name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone.strip(),
        hashed_password=get_password_hash(payload.password),
        role="STUDENT",
        is_available=True,
        is_approved=False,  # Requires Admin Approval!
        room_no=payload.room_no.strip(),
        hostel_block=payload.hostel_block.strip() if payload.hostel_block else "Block A"
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check Student Admin Approval Status
    if user.role.upper() == "STUDENT" and not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration pending Warden approval"
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
