from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import BookingStatus


class BookingCreate(BaseModel):
    lead_id: int
    unit_id: int
    amount: Decimal | None = Field(default=None, gt=0)  # empty = unit price


class BookingOut(BaseModel):
    id: int
    lead_id: int
    lead_name: str
    unit_id: int
    unit_label: str
    project_name: str
    amount: Decimal
    status: BookingStatus
    booked_by_name: str
    created_at: datetime