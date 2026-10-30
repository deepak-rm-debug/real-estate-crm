from app.db.session import SessionLocal
from app.models import Lead
from app.models.enums import LeadStage

TYPES = ["1BHK", "2BHK", "3BHK", "2BHK"]
REASONS = ["Price too high", "Chose a competitor", "Location not suitable", "No response"]


def run():
    db = SessionLocal()
    try:
        lost = 0
        for i, lead in enumerate(db.query(Lead).order_by(Lead.id).all()):
            if lead.preferred_type is None:
                lead.preferred_type = TYPES[i % len(TYPES)]
            if lead.stage == LeadStage.lost and lead.lost_reason is None:
                lead.lost_reason = REASONS[lost % len(REASONS)]
                lost += 1
        db.commit()
        print("Demo leads patched")
    finally:
        db.close()


if __name__ == "__main__":
    run()