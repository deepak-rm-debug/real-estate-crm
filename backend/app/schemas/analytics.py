from decimal import Decimal

from pydantic import BaseModel


class SourceStat(BaseModel):
    source: str
    leads: int
    booked: int
    lost: int
    conversion: float


class ReasonStat(BaseModel):
    reason: str
    count: int


class TeamStat(BaseModel):
    user_id: int
    name: str
    leads: int
    booked: int
    conversion: float
    overdue: int
    active_bookings: int
    revenue: Decimal


class AnalyticsOut(BaseModel):
    sources: list[SourceStat]
    lost_reasons: list[ReasonStat]
    team: list[TeamStat]