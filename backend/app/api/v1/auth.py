from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.core.observability import log_audit_event
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # Determine role: first user is admin, else user
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else (user_in.role or "user")

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or user_in.email.split("@")[0],
        role=role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit_event(db, user.id, "AUTH_REGISTER", "User", user.id, "SUCCESS")

    token = create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        log_audit_event(db, None, "AUTH_LOGIN_FAILED", "User", details={"email": form_data.username}, status="DENIED")
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    log_audit_event(db, user.id, "AUTH_LOGIN_SUCCESS", "User", user.id, "SUCCESS")
    token = create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login/json", response_model=Token)
def login_json(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email.lower()).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        log_audit_event(db, None, "AUTH_LOGIN_FAILED", "User", details={"email": creds.email}, status="DENIED")
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    log_audit_event(db, user.id, "AUTH_LOGIN_SUCCESS", "User", user.id, "SUCCESS")
    token = create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
