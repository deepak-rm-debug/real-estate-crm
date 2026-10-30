"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Building2, CalendarCheck, CalendarClock, IndianRupee, Plus, Users } from "lucide-react";

import { NewBookingModal } from "@/components/bookings/NewBookingModal";
import { PromoBanner } from "@/components/dashboard/PromoBanner";
import { NewLeadModal } from "@/components/leads/NewLeadModal";
import { AnimatedBar, AnimatedNumber } from "@/components/ui/Animated";
import { InteractiveDonut } from "@/components/ui/InteractiveDonut";
import { HealthBadge } from "@/components/ui/HealthBadge";
import { StageBadge } from "@/components/ui/StageBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { LEAD_STAGES, type DashboardData, type FollowUpItem, type User } from "@/lib/types";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Donut({ booked, total }: { booked: number; total: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const target = total ? booked / total : 0;
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPct(target), 50);
    return () => clearTimeout(t);
  }, [target]);

  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90" role="img" aria-label={`${Math.round(target * 100)} percent of units booked`}>
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="12" className="stroke-emerald-200" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
        className="stroke-indigo-600 transition-[stroke-dasharray] duration-1000 ease-out"
        strokeDasharray={`${c * pct} ${c}`}
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: React.ReactNode;
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
    <div data-tilt className="group rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition duration-300 group-hover:rotate-6 group-hover:scale-110 ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold transition duration-300 group-hover:translate-x-1">{value}</p>
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
              <Link href={`/leads/${f.id}`} className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-slate-50">
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

const TILE_TONES = {
  indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  violet: "bg-violet-50 text-violet-700 hover:bg-violet-100",
};

function ActionTile({
  icon: Icon,
  label,
  tone,
  onClick,
  href,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  tone: keyof typeof TILE_TONES;
  onClick?: () => void;
  href?: string;
}) {
  const cls = `flex flex-col items-start gap-3 rounded-xl p-4 text-left text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${TILE_TONES[tone]}`;
  const inner = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70">
        <Icon size={18} />
      </span>
      {label}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <button onClick={onClick} className={cls}>{inner}</button>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [leadOpen, setLeadOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/api/dashboard"),
    enabled: !!user,
  });

  const salesUsers = useQuery({
    queryKey: ["sales-users"],
    queryFn: () => api<User[]>("/api/users/sales"),
    enabled: isAdmin,
  });

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
  const bookedLeads = data.leads_by_stage["Booked"] ?? 0;
  const conversion = data.total_leads ? Math.round((bookedLeads / data.total_leads) * 100) : 0;

  return (
    <div>
      {/* Welcome + featured project */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-800 to-indigo-950 p-6 text-white lg:col-span-2">
          <p className="text-sm text-indigo-200/80">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="font-heading mt-1 text-2xl font-semibold">
            {greeting()}, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-indigo-100/80">
            {isAdmin ? "Here is how the whole team is doing." : "Here is your pipeline for today."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setLeadOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-indigo-950 transition hover:bg-gold-400"
            >
              <Plus size={16} /> New lead
            </button>
            <Link
              href="/properties"
              className="inline-flex items-center rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Browse units
            </Link>
          </div>
        </div>
        <PromoBanner />
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total leads"
          value={<AnimatedNumber value={data.total_leads} />}
          hint={`${data.new_leads_this_week} new this week`}
          icon={Users}
        />
        <StatCard
          label="Follow-ups today"
          value={<AnimatedNumber value={data.today_count} />}
          hint={`${data.overdue_count} overdue`}
          icon={CalendarClock}
          tone={data.overdue_count > 0 ? "amber" : "emerald"}
        />
        <StatCard
          label="Active bookings"
          value={<AnimatedNumber value={data.active_bookings} />}
          hint={formatCurrency(data.booking_value)}
          icon={CalendarCheck}
          tone="emerald"
        />
        <StatCard
          label="Units available"
          value={
            <>
              <AnimatedNumber value={data.units_available} />/{data.units_total}
            </>
          }
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
              {LEAD_STAGES.map((stage, i) => {
                const count = data.leads_by_stage[stage] ?? 0;
                return (
                  <li key={stage}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{stage}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <AnimatedBar
                      pct={(count / maxStage) * 100}
                      delay={i * 60}
                      className={stage === "Lost" ? "bg-red-400" : stage === "Booked" ? "bg-emerald-500" : "bg-indigo-500"}
                    />
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

      {/* Inventory + conversion */}
      <section className="mb-6 grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <div className="flex items-center gap-5">
          <div className="relative">
            <InteractiveDonut
              segments={[
                { label: "Booked", value: data.units_booked, stroke: "stroke-indigo-600" },
                { label: "Available", value: data.units_available, stroke: "stroke-emerald-300" },
                {
                  label: "Held",
                  value: Math.max(0, data.units_total - data.units_booked - data.units_available),
                  stroke: "stroke-amber-400",
                },
              ]}
              centerValue={`${occupancy}%`}
              centerLabel="booked"
            />
            
          </div>
          <div className="space-y-1 text-sm">
            <h2 className="font-semibold">Inventory</h2>
            <p className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> {data.units_booked} booked
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" /> {data.units_available} available
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="font-semibold">Lead to booking conversion</h2>
          <p className="font-heading mt-2 text-4xl font-semibold text-indigo-700">
            <AnimatedNumber value={conversion} />%
          </p>
          <p className="text-sm text-slate-500">{bookedLeads} of {data.total_leads} leads booked</p>
        </div>
      </section>

      {/* Call these first + quick actions */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold">Call these first</h2>
          <p className="mb-3 text-xs text-slate-500">Ranked by stage, follow-up urgency, recent activity and budget.</p>
          {data.priority_leads.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">No open leads to prioritise.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.priority_leads.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/leads/${p.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.reasons.join(" · ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StageBadge stage={p.stage} />
                      <HealthBadge health={p.health} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <ActionTile icon={Plus} label="Add lead" tone="emerald" onClick={() => setLeadOpen(true)} />
            <ActionTile icon={CalendarCheck} label="New booking" tone="amber" onClick={() => setBookOpen(true)} />
            <ActionTile icon={Building2} label="Check units" tone="indigo" href="/properties" />
            <ActionTile icon={Users} label="All leads" tone="violet" href="/leads" />
          </div>
        </section>
      </div>

      {/* Follow-ups */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FollowUpList title="Overdue follow-ups" items={data.overdue_followups} emptyText="Nothing overdue. Nice work." danger />
        <FollowUpList title="Today's follow-ups" items={data.todays_followups} emptyText="No follow-ups scheduled for today." />
      </div>

      <NewLeadModal open={leadOpen} onClose={() => setLeadOpen(false)} isAdmin={!!isAdmin} salesUsers={salesUsers.data ?? []} />
      <NewBookingModal open={bookOpen} onClose={() => setBookOpen(false)} />
    </div>
  );
}