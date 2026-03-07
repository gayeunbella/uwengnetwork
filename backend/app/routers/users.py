from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.post import DevLogPost
from app.models.user import User
from app.schemas.post import PostListResponse, PostPublic
from app.schemas.user import UserPublic, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


# /me routes must come before /{user_id} to avoid path parameter capture
@router.get("/me", response_model=UserPublic)
def get_me(current_user=Depends(get_current_user)):
    return UserPublic.model_validate(current_user)


@router.patch("/me", response_model=UserPublic)
def update_me(
    update: UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if update.name is not None:
        current_user.name = update.name
    if update.department is not None:
        current_user.department = update.department
    if update.year is not None:
        current_user.year = update.year
    if update.bio is not None:
        current_user.bio = update.bio

    db.commit()
    db.refresh(current_user)
    return UserPublic.model_validate(current_user)


@router.get("/{user_id}", response_model=UserPublic)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return UserPublic.model_validate(user)


@router.get("/{user_id}/posts", response_model=PostListResponse)
def get_user_posts(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(404, "User not found")

    query = db.query(DevLogPost).filter(DevLogPost.author_id == user_id)
    total = query.count()
    posts = (
        query.order_by(DevLogPost.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PostListResponse(
        posts=[PostPublic.model_validate(p) for p in posts],
        total=total,
        page=page,
        page_size=page_size,
    )
