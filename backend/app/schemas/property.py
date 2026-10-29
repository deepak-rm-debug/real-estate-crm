from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import UnitStatus


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    location: str = Field(min_length=2, max_length=255)
    description: str | None = None


class ProjectOut(BaseModel):
    id: int
    name: str
    location: str
    description: str | None = None
    building_count: int = 0
    total_units: int = 0
    available_units: int = 0


class BuildingCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    total_floors: int = Field(default=1, ge=1, le=200)


class BuildingOut(BaseModel):
    id: int
    project_id: int
    name: str
    total_floors: int
    total_units: int = 0
    available_units: int = 0


class UnitCreate(BaseModel):
    unit_number: str = Field(min_length=1, max_length=20)
    floor: int = Field(default=0, ge=0)
    type: str = Field(min_length=2, max_length=20)
    area_sqft: int = Field(default=0, ge=0)
    price: Decimal = Field(gt=0)


class UnitUpdate(BaseModel):
    unit_number: str | None = Field(default=None, min_length=1, max_length=20)
    floor: int | None = Field(default=None, ge=0)
    type: str | None = Field(default=None, min_length=2, max_length=20)
    area_sqft: int | None = Field(default=None, ge=0)
    price: Decimal | None = Field(default=None, gt=0)
    status: UnitStatus | None = None


class UnitOut(BaseModel):
    id: int
    building_id: int
    building_name: str
    project_id: int
    project_name: str
    unit_number: str
    floor: int
    type: str
    area_sqft: int
    price: Decimal
    status: UnitStatus


class UnitList(BaseModel):
    items: list[UnitOut]
    total: int
    page: int
    page_size: int