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