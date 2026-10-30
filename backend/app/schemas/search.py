from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import LeadStage, UnitStatus


class SearchLead(BaseModel):
    id: int
    name: str
    phone: str
    stage: LeadStage

    model_config = {"from_attributes": True}


class SearchProject(BaseModel):
    id: int
    name: str
    location: str

    model_config = {"from_attributes": True}


class SearchUnit(BaseModel):
    id: int
    label: str
    project_name: str
    type: str
    price: Decimal
    status: UnitStatus


class SearchOut(BaseModel):
    leads: list[SearchLead]
    projects: list[SearchProject]
    units: list[SearchUnit]