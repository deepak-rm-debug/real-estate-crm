import re
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, computed_field, field_validator, model_validator

from app.models.enums import LeadStage
from app.services.lead_health import compute_health

LOST_REASONS = [
    "Price too high",
    "Location not suitable",
    "Chose a competitor",
    "No response",
    "Not interested",
    "Other",
]

UnitType = Literal["1BHK", "2BHK", "3BHK", "Villa"]


def clean_phone(value: str) -> str:
    value = re.sub(r"[\s\-()]", "", value)
    if not re.match(r"^\+?[0-9]{10,15}$", value):
        raise ValueError("Enter a valid phone number (10-15 digits)")
    return value


class LeadBase(BaseModel):
    preferred_type: UnitType | None = None
    name: str = Field(min_length=2, max_length=150)
    phone: str
    email: EmailStr | None = None
    source: str | None = Field(default=None, max_length=50)
    budget: Decimal | None = Field(default=None, ge=0)
    follow_up_date: date | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, v):
        return v.strip()

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return clean_phone(v)

    @field_validator("email", "source", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        return None if v == "" else v


class LeadCreate(LeadBase):
    assigned_to: int | None = None


class LeadUpdate(BaseModel):
    preferred_type: UnitType | None = None
    name: str | None = Field(default=None, min_length=2, max_length=150)
    phone: str | None = None
    email: EmailStr | None = None
    source: str | None = Field(default=None, max_length=50)
    budget: Decimal | None = Field(default=None, ge=0)
    follow_up_date: date | None = None

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return clean_phone(v) if v else v

    @field_validator("email", "source", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        return None if v == "" else v


class StageUpdate(BaseModel):
    stage: LeadStage
    lost_reason: str | None = None

    @model_validator(mode="after")
    def check_lost_reason(self):
        if self.stage == LeadStage.lost:
            if self.lost_reason not in LOST_REASONS:
                raise ValueError("Select a reason for losing this lead")
        else:
            self.lost_reason = None
        return self


class AssignUpdate(BaseModel):
    assigned_to: int


class NoteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content")
    @classmethod
    def strip_content(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Note cannot be empty")
        return v


class UserBrief(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class NoteOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    user: UserBrief | None = None

    model_config = {"from_attributes": True}


class ActivityOut(BaseModel):
    id: int
    action: str
    old_value: str | None = None
    new_value: str | None = None
    created_at: datetime
    user: UserBrief | None = None

    model_config = {"from_attributes": True}


class LeadOut(BaseModel):
    id: int
    name: str
    phone: str
    email: str | None = None
    source: str | None = None
    budget: Decimal | None = None
    stage: LeadStage
    assigned_to: int | None = None
    assignee: UserBrief | None = None
    follow_up_date: date | None = None
    created_at: datetime
    updated_at: datetime
    lost_reason: str | None = None
    preferred_type: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def health(self) -> str | None:
        return compute_health(self.stage, self.follow_up_date, self.updated_at, self.budget)[0]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def health_reasons(self) -> list[str]:
        return compute_health(self.stage, self.follow_up_date, self.updated_at, self.budget)[2]

    model_config = {"from_attributes": True}


class LeadDetail(LeadOut):
    notes: list[NoteOut] = []
    activities: list[ActivityOut] = []


class LeadList(BaseModel):
    items: list[LeadOut]
    total: int
    page: int
    page_size: int




class MatchOut(BaseModel):
    id: int
    project_name: str
    building_name: str
    unit_number: str
    floor: int
    type: str
    area_sqft: int
    price: Decimal
    fit: str    