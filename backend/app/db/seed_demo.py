from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from app.db.session import SessionLocal
from app.models import Booking, Lead, LeadActivity, LeadNote, Unit, User
from app.models.enums import LeadStage, UnitStatus, UserRole

BUDGETS = [4500000, 6500000, 7500000, 9000000, 10500000, 12000000]
SOURCES = ["Website", "Referral", "Walk-in", "Facebook Ad", "Google Ad"]
NOTES = [
    "Called, wants a 2BHK on a higher floor.",
    "Site visit planned for the weekend.",
    "Comparing with another project, price is the concern.",
    "Asked for a payment plan and loan details.",
    "Family will visit together on Saturday.",
]

# (name, stage, follow-up offset in days or None)
NEW_LEADS = [
    ("Ramesh Babu", LeadStage.new, 0),
    ("Pooja Menon", LeadStage.contacted, -3),
    ("Ajay Verma", LeadStage.site_visit, 1),
    ("Nisha Gupta", LeadStage.interested, 0),
    ("Harish Kumar", LeadStage.negotiation, 2),
    ("Revathi Suresh", LeadStage.new, 3),
    ("Imran Khan", LeadStage.contacted, -1),
    ("Deepa Joseph", LeadStage.lost, None),
    ("Naveen Prasad", LeadStage.interested, 5),
    ("Swathi Rao", LeadStage.site_visit, -2),
    ("Gokul Raj", LeadStage.new, 0),
    ("Fatima Begum", LeadStage.contacted, 4),
    ("Arvind Swamy", LeadStage.negotiation, 6),
    ("Kavya Shetty", LeadStage.interested, 1),
    ("Manoj Tiwari", LeadStage.negotiation, None),
    ("Bhavana Iyer", LeadStage.negotiation, None),
    ("Siddharth Jain", LeadStage.negotiation, None),
    ("Anjali Das", LeadStage.negotiation, None),
]


def run():
    db = SessionLocal()
    try:
        if db.query(Lead).count() >= 25:
            print("Demo data already added, skipping.")
            return

        admin = db.query(User).filter(User.role == UserRole.admin).first()
        sales = db.query(User).filter(User.role == UserRole.sales).order_by(User.id).all()
        now = datetime.now(timezone.utc)
        today = date.today()

        # budgets for the original seed leads
        for i, lead in enumerate(db.query(Lead).order_by(Lead.id).all()):
            if lead.budget is None:
                lead.budget = Decimal(BUDGETS[i % len(BUDGETS)])

        created = []
        for i, (name, stage, offset) in enumerate(NEW_LEADS):
            owner = sales[i % len(sales)]
            lead = Lead(
                name=name,
                phone=f"98765{i + 11:05d}",
                email=f"{name.split()[0].lower()}@example.com",
                source=SOURCES[i % len(SOURCES)],
                budget=Decimal(BUDGETS[(i + 2) % len(BUDGETS)]),
                stage=stage,
                assigned_to=owner.id,
                created_by=admin.id,
                follow_up_date=today + timedelta(days=offset) if offset is not None else None,
                created_at=now - timedelta(days=i % 12, hours=i),
            )
            db.add(lead)
            created.append((lead, owner))
        db.flush()

        for i, (lead, owner) in enumerate(created):
            db.add(LeadActivity(lead_id=lead.id, user_id=admin.id, action="created", new_value="New"))
            if lead.stage != LeadStage.new:
                db.add(LeadActivity(
                    lead_id=lead.id, user_id=owner.id, action="stage_changed",
                    old_value="New", new_value=lead.stage.value,
                ))
            if i % 2 == 0:
                note = NOTES[i % len(NOTES)]
                db.add(LeadNote(lead_id=lead.id, user_id=owner.id, content=note))
                db.add(LeadActivity(lead_id=lead.id, user_id=owner.id, action="note_added", new_value=note[:80]))

        # book units for the last 4 leads
        units = db.query(Unit).filter(Unit.status == UnitStatus.available).order_by(Unit.id).all()
        picks = [units[i] for i in (1, 6, 11, 16) if i < len(units)]
        for (lead, owner), unit in zip(created[-4:], picks):
            db.add(Booking(lead_id=lead.id, unit_id=unit.id, booked_by=owner.id, amount=unit.price))
            unit.status = UnitStatus.booked
            lead.stage = LeadStage.booked
            db.add(LeadActivity(
                lead_id=lead.id, user_id=owner.id, action="booked",
                old_value="Negotiation", new_value=f"{unit.building.name} - {unit.unit_number}",
            ))

        # a couple of held units so the availability grid shows amber
        for unit in [u for u in units if u.status == UnitStatus.available][3:5]:
            unit.status = UnitStatus.held

        db.commit()
        print("Demo data added: 18 leads, notes, timeline, 4 bookings, 2 held units")
    finally:
        db.close()


if __name__ == "__main__":
    run()