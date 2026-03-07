from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.auth import require_verified
from app.database import get_db
from app.models.message import Message
from app.models.notification import Notification
from app.models.user import User
from app.schemas.message import MessagePublic, MessageSend, ThreadPreview
from app.schemas.user import UserPublic

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("", response_model=list[ThreadPreview])
def get_threads(
    current_user=Depends(require_verified),
    db: Session = Depends(get_db),
):
    sent_ids = {
        r[0]
        for r in db.query(Message.receiver_id)
        .filter(Message.sender_id == current_user.id)
        .distinct()
        .all()
    }
    received_ids = {
        r[0]
        for r in db.query(Message.sender_id)
        .filter(Message.receiver_id == current_user.id)
        .distinct()
        .all()
    }
    other_user_ids = sent_ids | received_ids

    threads = []
    for other_id in other_user_ids:
        other_user = db.query(User).filter(User.id == other_id).first()
        if not other_user:
            continue

        last_msg = (
            db.query(Message)
            .filter(
                or_(
                    and_(
                        Message.sender_id == current_user.id,
                        Message.receiver_id == other_id,
                    ),
                    and_(
                        Message.sender_id == other_id,
                        Message.receiver_id == current_user.id,
                    ),
                )
            )
            .order_by(Message.created_at.desc())
            .first()
        )

        unread_count = (
            db.query(Message)
            .filter(
                Message.sender_id == other_id,
                Message.receiver_id == current_user.id,
                Message.is_read.is_(False),
            )
            .count()
        )

        threads.append(
            ThreadPreview(
                other_user=UserPublic.model_validate(other_user),
                last_message=MessagePublic.model_validate(last_msg),
                unread_count=unread_count,
            )
        )

    threads.sort(key=lambda t: t.last_message.created_at, reverse=True)
    return threads


@router.get("/{user_id}", response_model=list[MessagePublic])
def get_thread(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user=Depends(require_verified),
    db: Session = Depends(get_db),
):
    # Mark incoming messages as read
    db.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user.id,
        Message.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()

    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(
                    Message.sender_id == current_user.id,
                    Message.receiver_id == user_id,
                ),
                and_(
                    Message.sender_id == user_id,
                    Message.receiver_id == current_user.id,
                ),
            )
        )
        .order_by(Message.created_at.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return [MessagePublic.model_validate(m) for m in messages]


@router.post("/{user_id}", response_model=MessagePublic)
def send_message(
    user_id: str,
    req: MessageSend,
    current_user=Depends(require_verified),
    db: Session = Depends(get_db),
):
    receiver = db.query(User).filter(User.id == user_id).first()
    if not receiver:
        raise HTTPException(404, "User not found")

    msg = Message(
        sender_id=current_user.id,
        receiver_id=user_id,
        body=req.body,
    )
    db.add(msg)
    db.flush()  # populate msg.id before creating notification

    preview = req.body[:100] + "..." if len(req.body) > 100 else req.body
    notif = Notification(
        user_id=user_id,
        type="message",
        title=f"{current_user.name} sent you a message",
        body=preview,
        reference_id=msg.id,
    )
    db.add(notif)
    db.commit()
    db.refresh(msg)

    return MessagePublic.model_validate(msg)
