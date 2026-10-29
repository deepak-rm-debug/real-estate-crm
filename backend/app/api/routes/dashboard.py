from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.routes.bookings import booking_to_out, load_options
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models import Booking, Lead, Unit, User
from app.models.enums import BookingStatus, LeadStage, UnitStatus, UserRole
from app.schemas.dashboard import DashboardOut

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    is_admin = user.role == UserRole.admin

    # ---- leads (sales sees only own leads) ----
    lead_q = db.query(Lead)
    if not is_admin:
        lead_q = lead_q.filter(Lead.assigned_to == user.id)

    leads_by_stage = {stage.value: 0 for stage in LeadStage}
    for stage, count in lead_q.with_entities(Lead.stage, func.count(Lead.id)).group_by(Lead.stage).all():
        leads_by_stage[stage.value] = count

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_this_week = lead_q.filter(Lead.created_at >= week_ago).count()

    # ---- follow-ups (closed leads are ignored) ----
    today = date.today()
    open_followups = lead_q.filter(
        Lead.stage.notin_([LeadStage.booked, LeadStage.lost]),
        Lead.follow_up_date.isnot(None),
    )
    today_q = open_followups.filter(Lead.follow_up_date == today)
    overdue_q = open_followups.filter(Lead.follow_up_date < today)

    # ---- bookings ----
    booking_q = db.query(Booking).filter(Booking.status == BookingStatus.active)
    if not is_admin:
        booking_q = booking_q.join(Lead, Booking.lead_id == Lead.id).filter(
            or_(Lead.assigned_to == user.id, Booking.booked_by == user.id)
        )
    booking_value = booking_q.with_entities(func.coalesce(func.sum(Booking.amount), 0)).scalar()
    recent = booking_q.options(*load_options()).order_by(Booking.created_at.desc()).limit(5).all()

    # ---- inventory ----
    unit_counts = dict(db.query(Unit.status, func.count(Unit.id)).group_by(Unit.status).all())

    return {
        "total_leads": sum(leads_by_stage.values()),
        "new_leads_this_week": new_this_week,
        "leads_by_stage": leads_by_stage,
        "today_count": today_q.count(),
        "overdue_count": overdue_q.count(),
        "todays_followups": today_q.order_by(Lead.name).limit(10).all(),
        "overdue_followups": overdue_q.order_by(Lead.follow_up_date).limit(10).all(),
        "active_bookings": booking_q.count(),
        "booking_value": booking_value,
        "units_total": sum(unit_counts.values()),
        "units_available": unit_counts.get(UnitStatus.available, 0),
        "units_booked": unit_counts.get(UnitStatus.booked, 0),
        "recent_bookings": [booking_to_out(b) for b in recent],
    }