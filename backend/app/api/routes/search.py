from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models import Building, Lead, Project, Unit, User
from app.models.enums import UserRole
from app.schemas.search import SearchOut

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get("", response_model=SearchOut)
def global_search(
    q: str = Query(..., min_length=2, max_length=50),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    like = f"%{q.strip()}%"

    # sales users only ever see their own leads, same rule as the leads API
    lead_q = db.query(Lead).filter(
        or_(Lead.name.ilike(like), Lead.phone.ilike(like), Lead.email.ilike(like))
    )
    if user.role != UserRole.admin:
        lead_q = lead_q.filter(Lead.assigned_to == user.id)
    leads = lead_q.order_by(Lead.updated_at.desc()).limit(5).all()

    projects = (
        db.query(Project)
        .filter(or_(Project.name.ilike(like), Project.location.ilike(like)))
        .order_by(Project.name)
        .limit(4)
        .all()
    )

    units = (
        db.query(Unit)
        .join(Unit.building)
        .join(Building.project)
        .options(joinedload(Unit.building).joinedload(Building.project))
        .filter(
            or_(
                Unit.unit_number.ilike(like),
                Unit.type.ilike(like),
                Building.name.ilike(like),
                Project.name.ilike(like),
            )
        )
        .order_by(Unit.status, Unit.id)  # available units first
        .limit(6)
        .all()
    )

    return {
        "leads": leads,
        "projects": projects,
        "units": [
            {
                "id": u.id,
                "label": f"{u.building.name} - {u.unit_number}",
                "project_name": u.building.project.name,
                "type": u.type,
                "price": u.price,
                "status": u.status,
            }
            for u in units
        ],
    }