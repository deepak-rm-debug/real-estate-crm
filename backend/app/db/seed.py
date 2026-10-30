from datetime import date, timedelta

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Building, Lead, Project, Unit, User
from app.models.enums import LeadStage, UserRole


def seed():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Already seeded, skipping.")
            return

        admin = User(name="Admin", email="admin@crm.com", password_hash=hash_password("Admin@123"), role=UserRole.admin)
        admin = User(name="Deepak", email="deepak@crm.com", password_hash=hash_password("Deepak@123"), role=UserRole.admin)
        priya = User(name="Priya", email="priya@crm.com", password_hash=hash_password("Sales@123"), role=UserRole.sales)
        arun = User(name="Arun", email="arun@crm.com", password_hash=hash_password("Sales@123"), role=UserRole.sales)
        db.add_all([admin, priya, arun])
        db.flush()

        sunrise = Project(name="Sunrise Heights", location="OMR, Chennai", description="Premium apartments near IT corridor")
        green = Project(name="Green Valley", location="Whitefield, Bengaluru", description="Gated community with open spaces")
        db.add_all([sunrise, green])
        db.flush()

        unit_types = [("1BHK", 650, 4500000), ("2BHK", 1050, 7500000), ("3BHK", 1450, 10500000)]
        for project, building_name in [(sunrise, "Tower A"), (sunrise, "Tower B"), (green, "Block 1")]:
            building = Building(project_id=project.id, name=building_name, total_floors=3)
            db.add(building)
            db.flush()
            for floor in range(1, 4):
                for idx, (utype, area, price) in enumerate(unit_types, start=1):
                    db.add(Unit(
                        building_id=building.id,
                        unit_number=f"{floor}0{idx}",
                        floor=floor,
                        type=utype,
                        area_sqft=area,
                        price=price + floor * 100000,
                    ))

        today = date.today()
        sample_leads = [
            ("Rahul Sharma", "9876500001", "Website", LeadStage.new, priya, today),
            ("Meena Iyer", "9876500002", "Referral", LeadStage.contacted, priya, today + timedelta(days=1)),
            ("Karthik Raja", "9876500003", "Walk-in", LeadStage.site_visit, priya, today - timedelta(days=2)),
            ("Divya Nair", "9876500004", "Facebook Ad", LeadStage.interested, arun, today + timedelta(days=2)),
            ("Suresh Kumar", "9876500005", "Website", LeadStage.negotiation, arun, today),
            ("Anita Reddy", "9876500006", "Referral", LeadStage.new, arun, today + timedelta(days=3)),
            ("Vijay Anand", "9876500007", "Walk-in", LeadStage.contacted, priya, today - timedelta(days=1)),
            ("Lakshmi Devi", "9876500008", "Website", LeadStage.lost, arun, None),
            ("Mohan Das", "9876500009", "Google Ad", LeadStage.interested, priya, today + timedelta(days=4)),
            ("Sneha Pillai", "9876500010", "Referral", LeadStage.site_visit, arun, today + timedelta(days=1)),
        ]
        for name, phone, source, stage, owner, follow_up in sample_leads:
            db.add(Lead(
                name=name, phone=phone, source=source, stage=stage,
                assigned_to=owner.id, created_by=admin.id, follow_up_date=follow_up,
            ))

        db.commit()
        print("Seed complete: 3 users, 2 projects, 3 buildings, 27 units, 10 leads")
    finally:
        db.close()


if __name__ == "__main__":
    seed()