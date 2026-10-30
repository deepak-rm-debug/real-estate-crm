from datetime import date, datetime, timezone

from app.models.enums import LeadStage

STAGE_POINTS = {
    LeadStage.new: 10,
    LeadStage.contacted: 20,
    LeadStage.site_visit: 40,
    LeadStage.interested: 55,
    LeadStage.negotiation: 70,
}


def compute_health(stage, follow_up_date, updated_at, budget):
    """Rule-based lead priority. Returns (label, score, reasons).

    Closed leads (Booked / Lost) have no health.
    """
    if stage in (LeadStage.booked, LeadStage.lost):
        return None, 0, []

    score = STAGE_POINTS.get(stage, 0)
    reasons = [f"{stage.value} stage"]

    if follow_up_date is None:
        score -= 5
        reasons.append("No follow-up scheduled")
    else:
        days = (follow_up_date - date.today()).days
        if days < -3:
            score -= 20
            reasons.append("Follow-up overdue by more than 3 days")
        elif days < 0:
            score -= 10
            reasons.append("Follow-up overdue")
        elif days <= 3:
            score += 10
            reasons.append("Follow-up due soon")

    idle_days = (datetime.now(timezone.utc) - updated_at).days
    if idle_days <= 2:
        score += 15
        reasons.append("Updated recently")
    elif idle_days > 7:
        score -= 15
        reasons.append(f"No update for {idle_days} days")

    if budget:
        score += 10
        reasons.append("Budget known")

    label = "hot" if score >= 65 else "warm" if score >= 35 else "cold"
    return label, score, reasons