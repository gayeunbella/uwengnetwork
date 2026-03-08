import json
import os
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_optional_user, require_verified
from app.config import settings
from app.database import get_db
from app.models.notification import Notification
from app.models.post import DevLogPost, PostComment, PostLike
from app.schemas.post import (
    VALID_CATEGORIES,
    VALID_FIELDS,
    VALID_STAGES,
    CommentCreate,
    CommentPublic,
    PostAuthorView,
    PostListResponse,
    PostPublic,
)
from app.schemas.user import UserPublic

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=PostListResponse)
def get_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    stage: Optional[str] = None,
    category: Optional[str] = None,
    exclude_categories: Optional[str] = None,
    tech: Optional[str] = None,
    field: Optional[str] = None,
    search: Optional[str] = None,
    author_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(DevLogPost)

    if stage:
        query = query.filter(DevLogPost.project_stage == stage)
    if category:
        query = query.filter(DevLogPost.category == category)
    if exclude_categories:
        excluded = [c.strip() for c in exclude_categories.split(",")]
        query = query.filter(~DevLogPost.category.in_(excluded))
    if tech:
        query = query.filter(DevLogPost.tech_stack.ilike(f"%{tech}%"))
    if field:
        query = query.filter(DevLogPost.field.ilike(f"%{field}%"))
    if search:
        query = query.filter(
            or_(
                DevLogPost.title.ilike(f"%{search}%"),
                DevLogPost.body.ilike(f"%{search}%"),
            )
        )
    if author_id:
        query = query.filter(DevLogPost.author_id == author_id)

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


@router.post("", response_model=PostPublic)
def create_post(
    title: str = Form(...),
    body: str = Form(...),
    project_stage: Optional[str] = Form(None),
    category: str = Form(...),
    tech_stack: str = Form("[]"),
    field: str = Form("[]"),
    images: Optional[list[UploadFile]] = File(default=None),
    current_user=Depends(require_verified),
    db: Session = Depends(get_db),
):
    community_categories = {"question", "news", "discussion"}
    if category in community_categories:
        project_stage = project_stage or "idea"
    elif not project_stage:
        raise HTTPException(422, "project_stage is required")
    if project_stage not in VALID_STAGES:
        raise HTTPException(422, f"project_stage must be one of {sorted(VALID_STAGES)}")
    if category not in VALID_CATEGORIES:
        raise HTTPException(422, f"category must be one of {sorted(VALID_CATEGORIES)}")
    if len(title) > 100:
        raise HTTPException(422, "Title max 100 chars")
    if len(body) > 2000:
        raise HTTPException(422, "Body max 2000 chars")

    try:
        tech_list = json.loads(tech_stack)
        field_list = json.loads(field)
    except json.JSONDecodeError:
        raise HTTPException(422, "tech_stack and field must be valid JSON arrays")

    if len(tech_list) > 5:
        raise HTTPException(422, "tech_stack max 5 items")
    for f_val in field_list:
        if f_val not in VALID_FIELDS:
            raise HTTPException(422, f"field value '{f_val}' must be one of {sorted(VALID_FIELDS)}")

    post_id = str(uuid.uuid4())

    media_paths: list[str] = []
    if images:
        post_dir = os.path.join(settings.UPLOAD_DIR, "posts", post_id)
        os.makedirs(post_dir, exist_ok=True)
        for i, img in enumerate(images[:3]):
            ext = os.path.splitext(img.filename or "")[1] or ".jpg"
            img_path = os.path.join(post_dir, f"{i}{ext}")
            with open(img_path, "wb") as f:
                shutil.copyfileobj(img.file, f)
            media_paths.append(f"/uploads/posts/{post_id}/{i}{ext}")

    post = DevLogPost(
        id=post_id,
        author_id=current_user.id,
        title=title,
        body=body,
        project_stage=project_stage,
        category=category,
        tech_stack=json.dumps(tech_list),
        field=json.dumps(field_list),
        media=json.dumps(media_paths),
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return PostPublic.model_validate(post)


@router.get("/liked")
def get_my_liked_post_ids(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    liked = db.query(PostLike.post_id).filter(PostLike.user_id == current_user.id).all()
    return [row[0] for row in liked]


@router.get("/{post_id}")
def get_post(
    post_id: str,
    current_user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    post = db.query(DevLogPost).filter(DevLogPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    if current_user and current_user.id == post.author_id:
        likes_users = [UserPublic.model_validate(like.user) for like in post.likes]
        base = PostPublic.model_validate(post)
        return PostAuthorView(
            **base.model_dump(),
            view_count=post.view_count,
            prof_view_count=post.prof_view_count,
            likes=likes_users,
        )

    if current_user:
        post.view_count += 1
        if current_user.is_professor:
            post.prof_view_count += 1
        db.commit()

    result = PostPublic.model_validate(post).model_dump()
    if current_user:
        liked = db.query(PostLike).filter(
            PostLike.post_id == post_id,
            PostLike.user_id == current_user.id,
        ).first() is not None
        result["liked_by_me"] = liked
    return result


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(DevLogPost).filter(DevLogPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    db.delete(post)
    db.commit()


@router.patch("/{post_id}", response_model=PostPublic)
def update_post(
    post_id: str,
    title: Optional[str] = Form(None),
    body: Optional[str] = Form(None),
    project_stage: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    tech_stack: Optional[str] = Form(None),
    field: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(DevLogPost).filter(DevLogPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    if title is not None:
        if len(title) > 100:
            raise HTTPException(422, "Title max 100 chars")
        post.title = title
    if body is not None:
        if len(body) > 2000:
            raise HTTPException(422, "Body max 2000 chars")
        post.body = body
    if project_stage is not None:
        if project_stage not in VALID_STAGES:
            raise HTTPException(422, f"project_stage must be one of {sorted(VALID_STAGES)}")
        post.project_stage = project_stage
    if category is not None:
        if category not in VALID_CATEGORIES:
            raise HTTPException(422, f"category must be one of {sorted(VALID_CATEGORIES)}")
        post.category = category
    if tech_stack is not None:
        try:
            tech_list = json.loads(tech_stack)
        except json.JSONDecodeError:
            raise HTTPException(422, "tech_stack must be valid JSON array")
        if len(tech_list) > 5:
            raise HTTPException(422, "tech_stack max 5 items")
        post.tech_stack = json.dumps(tech_list)
    if field is not None:
        try:
            field_list = json.loads(field)
        except json.JSONDecodeError:
            raise HTTPException(422, "field must be valid JSON array")
        for f_val in field_list:
            if f_val not in VALID_FIELDS:
                raise HTTPException(422, f"field value '{f_val}' must be one of {sorted(VALID_FIELDS)}")
        post.field = json.dumps(field_list)

    db.commit()
    db.refresh(post)
    return PostPublic.model_validate(post)


@router.post("/{post_id}/like")
def toggle_like(
    post_id: str,
    current_user=Depends(require_verified),
    db: Session = Depends(get_db),
):
    post = db.query(DevLogPost).filter(DevLogPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id == current_user.id:
        raise HTTPException(400, "Cannot like your own post")

    existing = (
        db.query(PostLike)
        .filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False}

    like = PostLike(post_id=post_id, user_id=current_user.id)
    db.add(like)

    notif = Notification(
        user_id=post.author_id,
        type="like",
        title=f"{current_user.name} checked out your project",
        body=f"Your post '{post.title}' was noticed",
        reference_id=post_id,
    )
    db.add(notif)
    db.commit()
    return {"liked": True}


@router.get("/{post_id}/likes")
def get_likes(
    post_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(DevLogPost).filter(DevLogPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(403, "Only the author can view likes")

    return [UserPublic.model_validate(like.user) for like in post.likes]


@router.get("/{post_id}/comments", response_model=list[CommentPublic])
def get_comments(
    post_id: str,
    db: Session = Depends(get_db),
):
    post = db.query(DevLogPost).filter(DevLogPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    comments = (
        db.query(PostComment)
        .filter(PostComment.post_id == post_id)
        .order_by(PostComment.created_at.asc())
        .all()
    )
    return [CommentPublic.model_validate(c) for c in comments]


@router.post("/{post_id}/comments", response_model=CommentPublic)
def create_comment(
    post_id: str,
    req: CommentCreate,
    current_user=Depends(require_verified),
    db: Session = Depends(get_db),
):
    post = db.query(DevLogPost).filter(DevLogPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        body=req.body,
    )
    db.add(comment)

    if post.author_id != current_user.id:
        notif = Notification(
            user_id=post.author_id,
            type="comment",
            title=f"{current_user.name} commented on your post",
            body=req.body[:100],
            reference_id=post_id,
        )
        db.add(notif)

    db.commit()
    db.refresh(comment)
    return CommentPublic.model_validate(comment)
