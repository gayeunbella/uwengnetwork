from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationListResponse, NotificationPublic

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class MarkReadRequest(BaseModel):
    notification_ids: list[str] = []
    all: bool = False


@router.get("", response_model=NotificationListResponse)
def get_notifications(
    unread: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    unread_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )

    if unread is True:
        query = query.filter(Notification.is_read.is_(False))

    notifications = (
        query.order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return NotificationListResponse(
        notifications=[NotificationPublic.model_validate(n) for n in notifications],
        unread_count=unread_count,
    )


@router.post("/read")
def mark_read(
    req: MarkReadRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.all:
        db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).update({"is_read": True})
    elif req.notification_ids:
        db.query(Notification).filter(
            Notification.id.in_(req.notification_ids),
            Notification.user_id == current_user.id,
        ).update({"is_read": True}, synchronize_session=False)

    db.commit()
    return {"success": True}
