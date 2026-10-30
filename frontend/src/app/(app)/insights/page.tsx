"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { BarFill } from "@/components/ui/Animated";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/States";
import { secondaryBtn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import type { AnalyticsData } from "@/lib/types";

export default function InsightsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api<AnalyticsData>("/api/analytics"),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <EmptyState
        title="Admins only"
        description="Insights are available to admin users."
        action={<Link href="/dashboard" className={secondaryBtn}>Back to dashboard</Link>}
      />
    );
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold">Insights</h1>
        <ListSkeleton rows={5} />
      </div>
    );
  }
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const maxLeads = Math.max(1, ...data.sources.map((s) => s.leads));
  const maxLost = Math.max(1, ...data.lost_reasons.map((r) => r.count));
  const best = [...data.sources].filter((s) => s.booked > 0).sort((a, b) => b.conversion - a.conversion)[0];
  const totalLost = data.lost_reasons.reduce((sum, r) => sum + r.count, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-sm text-slate-500">Where leads come from, why they are lost and how the team is doing.</p>
      </div>

      {/* Lead sources */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Lead sources</h2>
        {best && (
          <p className="mt-1 text-sm text-emerald-700">
            Best converting source: <strong>{best.source}</strong> ({best.conversion}% of its leads booked)
          </p>
        )}
        {data.sources.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No leads yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Source</th>
                  <th className="py-2 font-medium">Leads</th>
                  <th className="py-2 text-right font-medium">Booked</th>
                  <th className="py-2 text-right font-medium">Lost</th>
                  <th className="py-2 text-right font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sources.map((s) => (
                  <tr key={s.source}>
                    <td className="py-3 font-medium">{s.source}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                          <BarFill pct={(s.leads / maxLeads) * 100} className="bg-indigo-500" />
                        </div>
                        <span>{s.leads}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">{s.booked}</td>
                    <td className="py-3 text-right text-slate-500">{s.lost}</td>
                    <td className="py-3 text-right font-medium">{s.conversion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Lost reasons */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Why leads are lost</h2>
          <p className="text-xs text-slate-500">{totalLost} lost lead{totalLost === 1 ? "" : "s"}</p>
          {data.lost_reasons.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">No lost leads yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.lost_reasons.map((r) => (
                <li key={r.reason}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{r.reason}</span>
                    <span className="font-medium">{r.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <BarFill pct={(r.count / maxLost) * 100} className="bg-red-400" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick read */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Quick read</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              Top lost reason:{" "}
              <strong>{data.lost_reasons[0] ? data.lost_reasons[0].reason : "none recorded"}</strong>
            </li>
            <li>
              Highest volume source: <strong>{data.sources[0]?.source ?? "none"}</strong>
            </li>
            <li>
              Team revenue (active bookings):{" "}
              <strong>{formatCurrency(data.team.reduce((sum, t) => sum + Number(t.revenue), 0))}</strong>
            </li>
          </ul>
        </section>
      </div>

      {/* Scorecard */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Sales scorecard</h2>
        {data.team.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No sales employees yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Employee</th>
                  <th className="py-2 text-right font-medium">Leads</th>
                  <th className="py-2 text-right font-medium">Booked</th>
                  <th className="py-2 text-right font-medium">Conversion</th>
                  <th className="py-2 text-right font-medium">Overdue</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.team.map((t, i) => (
                  <tr key={t.user_id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} />
                        <span className="font-medium">{t.name}</span>
                        {i === 0 && t.revenue !== "0" && Number(t.revenue) > 0 && (
                          <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-medium text-gold-600">Top</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right">{t.leads}</td>
                    <td className="py-3 text-right">{t.booked}</td>
                    <td className="py-3 text-right">{t.conversion}%</td>
                    <td className={`py-3 text-right ${t.overdue > 0 ? "font-medium text-red-600" : "text-slate-500"}`}>{t.overdue}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}