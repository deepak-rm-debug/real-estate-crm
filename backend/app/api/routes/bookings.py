from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.routes.leads import get_lead_or_404, log_activity
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models import Booking, Building, Lead, Unit, User
from app.models.enums import BookingStatus, LeadStage, UnitStatus, UserRole
from app.schemas.booking import BookingCreate, BookingOut

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


def unit_label(unit: Unit) -> str:
    return f"{unit.building.name} - {unit.unit_number}"


def booking_to_out(b: Booking) -> dict:
    return {
        "id": b.id,
        "lead_id": b.lead_id,
        "lead_name": b.lead.name,
        "unit_id": b.unit_id,
        "unit_label": unit_label(b.unit),
        "project_name": b.unit.building.project.name,
        "amount": b.amount,
        "status": b.status,
        "booked_by_name": b.agent.name,
        "created_at": b.created_at,
    }


def load_options():
    return (
        joinedload(Booking.lead),
        joinedload(Booking.unit).joinedload(Unit.building).joinedload(Building.project),
        joinedload(Booking.agent),
    )


@router.get("", response_model=list[BookingOut])
def list_bookings(
    status_filter: BookingStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Booking).options(*load_options())
    if user.role != UserRole.admin:
        query = query.join(Lead, Booking.lead_id == Lead.id).filter(
            or_(Lead.assigned_to == user.id, Booking.booked_by == user.id)
        )
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    return [booking_to_out(b) for b in query.order_by(Booking.created_at.desc()).limit(200).all()]


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = get_lead_or_404(db, data.lead_id, user)

    if lead.stage == LeadStage.lost:
        raise HTTPException(status_code=400, detail="Reopen this lead before booking")
    if db.query(Booking).filter(Booking.lead_id == lead.id, Booking.status == BookingStatus.active).first():
        raise HTTPException(status_code=409, detail="This lead already has an active booking")

    # Row lock: a second user booking the same unit waits here until we commit
    unit = db.query(Unit).filter(Unit.id == data.unit_id).with_for_update().first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    if unit.status != UnitStatus.available:
        raise HTTPException(status_code=409, detail="This unit is no longer available")

    old_stage = lead.stage.value
    booking = Booking(
        lead_id=lead.id, unit_id=unit.id, booked_by=user.id,
        amount=data.amount or unit.price,
    )
    unit.status = UnitStatus.booked
    lead.stage = LeadStage.booked
    db.add(booking)

    try:
        db.flush()  # the partial unique index is the final safety net
        log_activity(db, lead.id, user.id, "booked", old=old_stage, new=unit_label(unit))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This unit was just booked by someone else")

    booking = db.query(Booking).options(*load_options()).filter(Booking.id == booking.id).one()
    return booking_to_out(booking)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    booking = db.query(Booking).options(*load_options()).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    lead = booking.lead
    if user.role != UserRole.admin and lead.assigned_to != user.id and booking.booked_by != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    unit = db.query(Unit).filter(Unit.id == booking.unit_id).with_for_update().first()
    booking.status = BookingStatus.cancelled
    unit.status = UnitStatus.available
    log_activity(db, lead.id, user.id, "booking_cancelled", old=LeadStage.booked.value, new=LeadStage.negotiation.value)
    lead.stage = LeadStage.negotiation
    db.commit()

    booking = db.query(Booking).options(*load_options()).filter(Booking.id == booking_id).one()
    return booking_to_out(booking)