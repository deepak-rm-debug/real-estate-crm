from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import LeadStage
from app.schemas.booking import BookingOut


class FollowUpItem(BaseModel):
    id: int
    name: str
    phone: str
    stage: LeadStage
    follow_up_date: date

    model_config = {"from_attributes": True}


class PriorityLead(BaseModel):
    id: int
    name: str
    phone: str
    stage: LeadStage
    health: str
    score: int
    reasons: list[str]


class DashboardOut(BaseModel):
    total_leads: int
    new_leads_this_week: int
    leads_by_stage: dict[str, int]
    today_count: int
    overdue_count: int
    todays_followups: list[FollowUpItem]
    overdue_followups: list[FollowUpItem]
    active_bookings: int
    booking_value: Decimal
    units_total: int
    units_available: int
    units_booked: int
    recent_bookings: list[BookingOut]
    priority_leads: list[PriorityLead]