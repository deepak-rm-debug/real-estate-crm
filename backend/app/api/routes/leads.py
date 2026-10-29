from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models import Booking, Lead, LeadActivity, LeadNote, User
from app.models.enums import BookingStatus, LeadStage, UserRole
from app.schemas.lead import (
    AssignUpdate, LeadCreate, LeadDetail, LeadList, LeadOut,
    LeadUpdate, NoteCreate, NoteOut, StageUpdate,
)

router = APIRouter(prefix="/api/leads", tags=["Leads"])


def log_activity(db: Session, lead_id: int, user_id: int, action: str, old=None, new=None):
    db.add(LeadActivity(lead_id=lead_id, user_id=user_id, action=action, old_value=old, new_value=new))


def get_lead_or_404(db: Session, lead_id: int, user: User) -> Lead:
    lead = db.get(Lead, lead_id)
    # 404 (not 403) so a sales user cannot even detect other people's leads
    if lead is None or (user.role != UserRole.admin and lead.assigned_to != user.id):
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


def get_assignee_or_400(db: Session, user_id: int) -> User:
    assignee = db.get(User, user_id)
    if assignee is None or not assignee.is_active:
        raise HTTPException(status_code=400, detail="Assignee not found or inactive")
    return assignee


def ensure_phone_unique(db: Session, phone: str, exclude_id: int | None = None):
    query = db.query(Lead).filter(Lead.phone == phone)
    if exclude_id:
        query = query.filter(Lead.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=409, detail="A lead with this phone number already exists")


@router.get("", response_model=LeadList)
def list_leads(
    q: str | None = None,
    stage: LeadStage | None = None,
    assigned_to: int | None = None,
    follow_up: Literal["overdue", "today", "upcoming"] | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Lead).options(joinedload(Lead.assignee))

    if user.role != UserRole.admin:
        query = query.filter(Lead.assigned_to == user.id)
    elif assigned_to:
        query = query.filter(Lead.assigned_to == assigned_to)

    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(or_(Lead.name.ilike(like), Lead.phone.ilike(like), Lead.email.ilike(like)))
    if stage:
        query = query.filter(Lead.stage == stage)

    today = date.today()
    closed_stages = [LeadStage.booked, LeadStage.lost]
    if follow_up == "overdue":
        query = query.filter(Lead.follow_up_date < today, Lead.stage.notin_(closed_stages))
    elif follow_up == "today":
        query = query.filter(Lead.follow_up_date == today)
    elif follow_up == "upcoming":
        query = query.filter(Lead.follow_up_date > today)

    total = query.count()
    items = query.order_by(Lead.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(data: LeadCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ensure_phone_unique(db, data.phone)

    # Sales users always own the leads they create; only admin can pick the assignee
    if user.role == UserRole.admin and data.assigned_to:
        assignee_id = get_assignee_or_400(db, data.assigned_to).id
    else:
        assignee_id = user.id

    lead = Lead(
        **data.model_dump(exclude={"assigned_to"}),
        assigned_to=assignee_id,
        created_by=user.id,
        stage=LeadStage.new,
    )
    db.add(lead)
    db.flush()
    log_activity(db, lead.id, user.id, "created", new=lead.stage.value)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadDetail)
def get_lead(lead_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_lead_or_404(db, lead_id, user)


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = get_lead_or_404(db, lead_id, user)
    changes = data.model_dump(exclude_unset=True)

    # name and phone are required columns, so ignore explicit nulls for them
    for required in ("name", "phone"):
        if required in changes and changes[required] is None:
            changes.pop(required)

    if "phone" in changes:
        ensure_phone_unique(db, changes["phone"], exclude_id=lead.id)

    if "follow_up_date" in changes and changes["follow_up_date"] != lead.follow_up_date:
        log_activity(
            db, lead.id, user.id, "follow_up_changed",
            old=str(lead.follow_up_date) if lead.follow_up_date else None,
            new=str(changes["follow_up_date"]) if changes["follow_up_date"] else None,
        )

    for field, value in changes.items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}/stage", response_model=LeadOut)
def change_stage(lead_id: int, data: StageUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = get_lead_or_404(db, lead_id, user)
    if data.stage == lead.stage:
        return lead

    if data.stage == LeadStage.booked:
        raise HTTPException(status_code=400, detail="A lead becomes 'Booked' only through the booking flow")

    if lead.stage == LeadStage.booked:
        has_active = db.query(Booking).filter(
            Booking.lead_id == lead.id, Booking.status == BookingStatus.active
        ).first()
        if has_active:
            raise HTTPException(status_code=400, detail="Cancel the booking first to change this lead's stage")

    log_activity(db, lead.id, user.id, "stage_changed", old=lead.stage.value, new=data.stage.value)
    lead.stage = data.stage
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}/assign", response_model=LeadOut)
def assign_lead(lead_id: int, data: AssignUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    assignee = get_assignee_or_400(db, data.assigned_to)

    old_name = lead.assignee.name if lead.assignee else "Unassigned"
    log_activity(db, lead.id, admin.id, "assigned", old=old_name, new=assignee.name)
    lead.assigned_to = assignee.id
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/notes", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def add_note(lead_id: int, data: NoteCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = get_lead_or_404(db, lead_id, user)
    note = LeadNote(lead_id=lead.id, user_id=user.id, content=data.content)
    db.add(note)
    log_activity(db, lead.id, user.id, "note_added", new=data.content[:80])
    db.commit()
    db.refresh(note)
    return note