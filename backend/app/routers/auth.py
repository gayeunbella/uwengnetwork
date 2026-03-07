import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, WatcardVerifyResponse
from app.schemas.user import UserPublic
from app.services.watcard import verify_watcard

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        department=req.department,
        year=req.year,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserPublic.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserPublic.model_validate(user))


@router.post("/verify-watcard", response_model=WatcardVerifyResponse)
def verify_watcard_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    watcard_dir = os.path.join(settings.UPLOAD_DIR, "watcards")
    os.makedirs(watcard_dir, exist_ok=True)
    file_path = os.path.join(watcard_dir, f"{current_user.id}.jpg")

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    result = verify_watcard(file_path)

    if result.is_engineering:
        current_user.is_verified = True
        db.commit()

    return result
