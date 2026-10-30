"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Summary {
  total_leads: number;
  active_bookings: number;
  units_available: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Summary>("/api/dashboard"),
    enabled: !!user,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-slate-500">Full dashboard comes in the next step.</p>
      {data && (
        <ul className="mt-4 space-y-1 text-slate-700">
          <li>Total leads: {data.total_leads}</li>
          <li>Active bookings: {data.active_bookings}</li>
          <li>Units available: {data.units_available}</li>
        </ul>
      )}
    </div>
  );
}