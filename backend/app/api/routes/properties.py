from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import distinct, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models import Booking, Building, Project, Unit, User
from app.models.enums import UnitStatus
from app.schemas.property import (
    BuildingCreate, BuildingOut, ProjectCreate, ProjectOut,
    UnitCreate, UnitList, UnitOut, UnitUpdate,
)

router = APIRouter(prefix="/api", tags=["Properties"])


def unit_to_out(unit: Unit) -> dict:
    building = unit.building
    return {
        "id": unit.id,
        "building_id": building.id,
        "building_name": building.name,
        "project_id": building.project.id,
        "project_name": building.project.name,
        "unit_number": unit.unit_number,
        "floor": unit.floor,
        "type": unit.type,
        "area_sqft": unit.area_sqft,
        "price": unit.price,
        "status": unit.status,
    }


# ---------- projects ----------
@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(
            Project.id,
            func.count(distinct(Building.id)).label("buildings"),
            func.count(Unit.id).label("units"),
            func.count(Unit.id).filter(Unit.status == UnitStatus.available).label("available"),
        )
        .outerjoin(Building, Building.project_id == Project.id)
        .outerjoin(Unit, Unit.building_id == Building.id)
        .group_by(Project.id)
        .all()
    )
    stats = {row.id: row for row in rows}
    result = []
    for p in db.query(Project).order_by(Project.name).all():
        s = stats.get(p.id)
        result.append({
            "id": p.id, "name": p.name, "location": p.location, "description": p.description,
            "building_count": s.buildings if s else 0,
            "total_units": s.units if s else 0,
            "available_units": s.available if s else 0,
        })
    return result


@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    project = Project(**data.model_dump())
    db.add(project)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A project with this name already exists")
    db.refresh(project)
    return {"id": project.id, "name": project.name, "location": project.location, "description": project.description}


# ---------- buildings ----------
@router.get("/projects/{project_id}/buildings", response_model=list[BuildingOut])
def list_buildings(project_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if db.get(Project, project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    rows = (
        db.query(
            Building,
            func.count(Unit.id).label("units"),
            func.count(Unit.id).filter(Unit.status == UnitStatus.available).label("available"),
        )
        .outerjoin(Unit, Unit.building_id == Building.id)
        .filter(Building.project_id == project_id)
        .group_by(Building.id)
        .order_by(Building.name)
        .all()
    )
    return [
        {"id": b.id, "project_id": b.project_id, "name": b.name, "total_floors": b.total_floors,
         "total_units": units, "available_units": available}
        for b, units, available in rows
    ]


@router.post("/projects/{project_id}/buildings", response_model=BuildingOut, status_code=status.HTTP_201_CREATED)
def create_building(project_id: int, data: BuildingCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.get(Project, project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    building = Building(project_id=project_id, **data.model_dump())
    db.add(building)
    db.commit()
    db.refresh(building)
    return {"id": building.id, "project_id": project_id, "name": building.name, "total_floors": building.total_floors}


# ---------- units ----------
@router.get("/units", response_model=UnitList)
def list_units(
    project_id: int | None = None,
    building_id: int | None = None,
    type: str | None = None,
    status_filter: UnitStatus | None = Query(default=None, alias="status"),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Unit).join(Unit.building).options(joinedload(Unit.building).joinedload(Building.project))
    if project_id:
        query = query.filter(Building.project_id == project_id)
    if building_id:
        query = query.filter(Unit.building_id == building_id)
    if type:
        query = query.filter(Unit.type == type)
    if status_filter:
        query = query.filter(Unit.status == status_filter)
    if min_price is not None:
        query = query.filter(Unit.price >= min_price)
    if max_price is not None:
        query = query.filter(Unit.price <= max_price)

    total = query.count()
    units = (
        query.order_by(Unit.building_id, Unit.floor, Unit.unit_number)
        .offset((page - 1) * page_size).limit(page_size).all()
    )
    return {"items": [unit_to_out(u) for u in units], "total": total, "page": page, "page_size": page_size}


@router.post("/buildings/{building_id}/units", response_model=UnitOut, status_code=status.HTTP_201_CREATED)
def create_unit(building_id: int, data: UnitCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.get(Building, building_id) is None:
        raise HTTPException(status_code=404, detail="Building not found")
    unit = Unit(building_id=building_id, **data.model_dump())
    db.add(unit)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This unit number already exists in the building")
    db.refresh(unit)
    return unit_to_out(unit)


@router.put("/units/{unit_id}", response_model=UnitOut)
def update_unit(unit_id: int, data: UnitUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    unit = db.query(Unit).filter(Unit.id == unit_id).with_for_update().first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")

    changes = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "status" in changes and (unit.status == UnitStatus.booked or changes["status"] == UnitStatus.booked):
        raise HTTPException(status_code=400, detail="Booked status changes only through the booking flow")

    for field, value in changes.items():
        setattr(unit, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This unit number already exists in the building")
    db.refresh(unit)
    return unit_to_out(unit)


@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(unit_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    unit = db.get(Unit, unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    if db.query(Booking).filter(Booking.unit_id == unit_id).first():
        raise HTTPException(status_code=400, detail="Unit has booking history and cannot be deleted")
    db.delete(unit)
    db.commit()