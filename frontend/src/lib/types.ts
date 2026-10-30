export type Role = "admin" | "sales";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}


export const LEAD_STAGES = [
  "New",
  "Contacted",
  "Site Visit",
  "Interested",
  "Negotiation",
  "Booked",
  "Lost",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

export interface UserBrief {
  id: number;
  name: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
  budget: string | null;
  stage: LeadStage;
  assigned_to: number | null;
  assignee: UserBrief | null;
  health: "hot" | "warm" | "cold" | null;
  health_reasons: string[];
  lost_reason: string | null;
  preferred_type: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  page_size: number;
}

export type UnitStatus = "available" | "held" | "booked";

export interface Project {
  id: number;
  name: string;
  location: string;
  description: string | null;
  building_count: number;
  total_units: number;
  available_units: number;
}

export interface Building {
  id: number;
  project_id: number;
  name: string;
  total_floors: number;
  total_units: number;
  available_units: number;
}

export interface Unit {
  id: number;
  building_id: number;
  building_name: string;
  project_id: number;
  project_name: string;
  unit_number: string;
  floor: number;
  type: string;
  area_sqft: number;
  price: string;
  status: UnitStatus;
}

export interface UnitListResponse {
  items: Unit[];
  total: number;
  page: number;
  page_size: number;
}

export interface Booking {
  id: number;
  lead_id: number;
  lead_name: string;
  unit_id: number;
  unit_label: string;
  project_name: string;
  amount: string;
  status: "active" | "cancelled";
  booked_by_name: string;
  created_at: string;
}

export interface NoteItem {
  id: number;
  content: string;
  created_at: string;
  user: UserBrief | null;
}

export interface ActivityItem {
  id: number;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user: UserBrief | null;
}

export interface LeadDetail extends Lead {
  notes: NoteItem[];
  activities: ActivityItem[];
}

export interface FollowUpItem {
  id: number;
  name: string;
  phone: string;
  stage: LeadStage;
  follow_up_date: string;
}

export interface DashboardData {
  total_leads: number;
  new_leads_this_week: number;
  leads_by_stage: Record<string, number>;
  today_count: number;
  overdue_count: number;
  todays_followups: FollowUpItem[];
  overdue_followups: FollowUpItem[];
  active_bookings: number;
  booking_value: string;
  units_total: number;
  units_available: number;
  units_booked: number;
  recent_bookings: Booking[];
  priority_leads: PriorityLead[];
}

export interface PriorityLead {
  id: number;
  name: string;
  phone: string;
  stage: LeadStage;
  health: "hot" | "warm" | "cold";
  score: number;
  reasons: string[];
}

export interface Match {
  id: number;
  project_name: string;
  building_name: string;
  unit_number: string;
  floor: number;
  type: string;
  area_sqft: number;
  price: string;
  fit: string;
}

export interface SourceStat {
  source: string;
  leads: number;
  booked: number;
  lost: number;
  conversion: number;
}

export interface ReasonStat {
  reason: string;
  count: number;
}

export interface TeamStat {
  user_id: number;
  name: string;
  leads: number;
  booked: number;
  conversion: number;
  overdue: number;
  active_bookings: number;
  revenue: string;
}

export interface AnalyticsData {
  sources: SourceStat[];
  lost_reasons: ReasonStat[];
  team: TeamStat[];
}
