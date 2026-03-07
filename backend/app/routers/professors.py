from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.professor import Professor
from app.schemas.professor import ProfessorListResponse, ProfessorPublic

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


@router.get("/{professor_id}", response_model=ProfessorPublic)
def get_professor(professor_id: str, db: Session = Depends(get_db)):
    prof = db.query(Professor).filter(Professor.id == professor_id).first()
    if not prof:
        raise HTTPException(404, "Professor not found")
    return ProfessorPublic.model_validate(prof)
