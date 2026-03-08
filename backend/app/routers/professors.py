import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.professor import Professor
from app.schemas.professor import (
    ProfessorCreate,
    ProfessorListResponse,
    ProfessorPublic,
    ProfessorUpdate,
)

router = APIRouter(prefix="/api/professors", tags=["professors"])


@router.get("", response_model=ProfessorListResponse)
def get_professors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    department: Optional[str] = None,
    faculty: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Professor)

    if department:
        query = query.filter(Professor.department == department)
    if faculty:
        query = query.filter(Professor.faculty == faculty)
    if search:
        query = query.filter(
            Professor.name.ilike(f"%{search}%")
            | Professor.research_interests.ilike(f"%{search}%")
        )

    total = query.count()
    professors = (
        query.order_by(Professor.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ProfessorListResponse(
        professors=[ProfessorPublic.model_validate(p) for p in professors],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/me", response_model=ProfessorPublic)
def get_my_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_professor:
        raise HTTPException(403, "Only professors can access this")
    prof = (
        db.query(Professor)
        .filter(Professor.claimed_user_id == current_user.id)
        .first()
    )
    if not prof:
        # Check if there's an unclaimed profile matching their email
        prof = (
            db.query(Professor)
            .filter(Professor.email == current_user.email, Professor.claimed == False)
            .first()
        )
        if prof:
            prof.claimed = True
            prof.claimed_user_id = current_user.id
            db.commit()
            db.refresh(prof)
    if not prof:
        raise HTTPException(404, "No professor profile found")
    return ProfessorPublic.model_validate(prof)


@router.post("", response_model=ProfessorPublic)
def create_profile(
    req: ProfessorCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_professor:
        raise HTTPException(403, "Only professors can create a profile")

    existing = (
        db.query(Professor)
        .filter(Professor.claimed_user_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(400, "You already have a profile")

    # Check if there's an unclaimed scraped profile
    scraped = (
        db.query(Professor)
        .filter(Professor.email == current_user.email, Professor.claimed == False)
        .first()
    )
    if scraped:
        scraped.claimed = True
        scraped.claimed_user_id = current_user.id
        scraped.name = req.name
        scraped.department = req.department
        scraped.research_interests = json.dumps(req.research_interests)
        scraped.profile_url = req.profile_url
        db.commit()
        db.refresh(scraped)
        return ProfessorPublic.model_validate(scraped)

    prof = Professor(
        name=req.name,
        department=req.department,
        faculty="Engineering",
        research_interests=json.dumps(req.research_interests),
        email=current_user.email,
        profile_url=req.profile_url,
        claimed=True,
        claimed_user_id=current_user.id,
    )
    db.add(prof)
    db.commit()
    db.refresh(prof)
    return ProfessorPublic.model_validate(prof)


@router.patch("/me", response_model=ProfessorPublic)
def update_profile(
    req: ProfessorUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_professor:
        raise HTTPException(403, "Only professors can update a profile")
    prof = (
        db.query(Professor)
        .filter(Professor.claimed_user_id == current_user.id)
        .first()
    )
    if not prof:
        raise HTTPException(404, "No professor profile found")

    if req.name is not None:
        prof.name = req.name
    if req.department is not None:
        prof.department = req.department
    if req.research_interests is not None:
        prof.research_interests = json.dumps(req.research_interests)
    if req.profile_url is not None:
        prof.profile_url = req.profile_url

    db.commit()
    db.refresh(prof)
    return ProfessorPublic.model_validate(prof)


@router.get("/{professor_id}", response_model=ProfessorPublic)
def get_professor(professor_id: str, db: Session = Depends(get_db)):
    prof = db.query(Professor).filter(Professor.id == professor_id).first()
    if not prof:
        raise HTTPException(404, "Professor not found")
    return ProfessorPublic.model_validate(prof)
