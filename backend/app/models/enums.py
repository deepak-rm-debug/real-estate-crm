import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    sales = "sales"


class LeadStage(str, enum.Enum):
    new = "New"
    contacted = "Contacted"
    site_visit = "Site Visit"
    interested = "Interested"
    negotiation = "Negotiation"
    booked = "Booked"
    lost = "Lost"


class UnitStatus(str, enum.Enum):
    available = "available"
    held = "held"
    booked = "booked"


class BookingStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"


def enum_values(enum_cls):
    """Store enum VALUES (e.g. 'Site Visit') in DB instead of names."""
    return [member.value for member in enum_cls]