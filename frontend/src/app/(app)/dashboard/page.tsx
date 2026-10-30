"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Building2, CalendarCheck, CalendarClock, IndianRupee, Users } from "lucide-react";

import { StageBadge } from "@/components/ui/StageBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { LEAD_STAGES, type DashboardData, type FollowUpItem } from "@/lib/types";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ size?: number }>;
  tone?: "indigo" | "red" | "emerald" | "amber";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function FollowUpList({
  title,
  items,
  emptyText,
  danger,
}: {
  title: string;
  items: FollowUpItem[];
  emptyText: string;
  danger?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        {danger && <AlertCircle size={16} className="text-red-500" />}
        {title}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((f) => (
            <li key={f.id}>
              <Link href={`/leads/${f.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-slate-500">{f.phone}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StageBadge stage={f.stage} />
                  <span className={`text-xs ${danger ? "font-medium text-red-600" : "text-slate-500"}`}>
                    {formatDate(f.follow_up_date)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/api/dashboard"),
    enabled: !!user,
  });

  const isAdmin = user?.role === "admin";

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
        <ListSkeleton rows={5} />
      </div>
    );
  }
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const maxStage = Math.max(1, ...Object.values(data.leads_by_stage));
  const occupancy = data.units_total ? Math.round((data.units_booked / data.units_total) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          {isAdmin ? "Overview of the whole team" : `Your pipeline, ${user?.name}`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total leads" value={data.total_leads} hint={`${data.new_leads_this_week} new this week`} icon={Users} />
        <StatCard
          label="Follow-ups today"
          value={data.today_count}
          hint={`${data.overdue_count} overdue`}
          icon={CalendarClock}
          tone={data.overdue_count > 0 ? "amber" : "emerald"}
        />
        <StatCard label="Active bookings" value={data.active_bookings} hint={formatCurrency(data.booking_value)} icon={CalendarCheck} tone="emerald" />
        <StatCard
          label="Units available"
          value={`${data.units_available}/${data.units_total}`}
          hint={`${occupancy}% booked`}
          icon={Building2}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Pipeline */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Pipeline by stage</h2>
          {data.total_leads === 0 ? (
            <p className="py-4 text-sm text-slate-500">No leads yet.</p>
          ) : (
            <ul className="space-y-3">
              {LEAD_STAGES.map((stage) => {
                const count = data.leads_by_stage[stage] ?? 0;
                return (
                  <li key={stage}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{stage}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${stage === "Lost" ? "bg-red-400" : stage === "Booked" ? "bg-emerald-500" : "bg-indigo-500"}`}
                        style={{ width: `${(count / maxStage) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent bookings */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent bookings</h2>
            <Link href="/bookings" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {data.recent_bookings.length === 0 ? (
            <EmptyState title="No bookings yet" description="Bookings you confirm will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent_bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/leads/${b.lead_id}`} className="truncate text-sm font-medium hover:text-indigo-600">
                      {b.lead_name}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{b.unit_label} · {b.project_name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="flex items-center justify-end gap-0.5 text-sm font-medium">
                      <IndianRupee size={12} />
                      {formatCurrency(b.amount).replace("₹", "")}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(b.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Follow-ups */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FollowUpList title="Overdue follow-ups" items={data.overdue_followups} emptyText="Nothing overdue. Nice work." danger />
        <FollowUpList title="Today's follow-ups" items={data.todays_followups} emptyText="No follow-ups scheduled for today." />
      </div>
    </div>
  );
}