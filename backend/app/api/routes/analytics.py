from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models import Booking, Lead, User
from app.models.enums import BookingStatus, LeadStage, UserRole
from app.schemas.analytics import AnalyticsOut

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def pct(part: int, whole: int) -> float:
    return round(part * 100 / whole, 1) if whole else 0.0


@router.get("", response_model=AnalyticsOut)
def analytics(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    # ---- lead sources: volume and conversion ----
    source_col = func.coalesce(Lead.source, "Unknown").label("source")
    source_rows = (
        db.query(
            source_col,
            func.count(Lead.id),
            func.count(Lead.id).filter(Lead.stage == LeadStage.booked),
            func.count(Lead.id).filter(Lead.stage == LeadStage.lost),
        )
        .group_by(source_col)
        .order_by(func.count(Lead.id).desc())
        .all()
    )
    sources = [
        {"source": s, "leads": n, "booked": b, "lost": lost, "conversion": pct(b, n)}
        for s, n, b, lost in source_rows
    ]

    # ---- why leads are lost ----
    reason_col = func.coalesce(Lead.lost_reason, "Not recorded").label("reason")
    reason_rows = (
        db.query(reason_col, func.count(Lead.id))
        .filter(Lead.stage == LeadStage.lost)
        .group_by(reason_col)
        .order_by(func.count(Lead.id).desc())
        .all()
    )
    lost_reasons = [{"reason": r, "count": c} for r, c in reason_rows]

    # ---- sales scorecard ----
    today = date.today()
    team = []
    for u in db.query(User).filter(User.role == UserRole.sales).order_by(User.name).all():
        mine = db.query(Lead).filter(Lead.assigned_to == u.id)
        total = mine.count()
        booked = mine.filter(Lead.stage == LeadStage.booked).count()
        overdue = mine.filter(
            Lead.follow_up_date < today,
            Lead.stage.notin_([LeadStage.booked, LeadStage.lost]),
        ).count()
        active = db.query(Booking).filter(Booking.booked_by == u.id, Booking.status == BookingStatus.active)
        revenue = active.with_entities(func.coalesce(func.sum(Booking.amount), 0)).scalar()
        team.append({
            "user_id": u.id,
            "name": u.name,
            "leads": total,
            "booked": booked,
            "conversion": pct(booked, total),
            "overdue": overdue,
            "active_bookings": active.count(),
            "revenue": revenue,
        })
    team.sort(key=lambda t: t["revenue"], reverse=True)

    return {"sources": sources, "lost_reasons": lost_reasons, "team": team}