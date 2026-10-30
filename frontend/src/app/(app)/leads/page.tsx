"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone, Plus, Search } from "lucide-react";

import { NewLeadModal } from "@/components/leads/NewLeadModal";
import { Avatar } from "@/components/ui/Avatar";
import { HealthBadge } from "@/components/ui/HealthBadge";
import { Pagination } from "@/components/ui/Pagination";
import { StageBadge } from "@/components/ui/StageBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/States";
import { inputClass, primaryBtn, secondaryBtn } from "@/components/ui/styles";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate, todayISO, whatsappLink } from "@/lib/format";
import { LEAD_STAGES, type Lead, type LeadListResponse, type User } from "@/lib/types";

const PAGE_SIZE = 10;

function LeadsList({ items }: { items: Lead[] }) {
  const today = todayISO();
  const isOverdue = (l: Lead) =>
    !!l.follow_up_date && l.follow_up_date < today && l.stage !== "Booked" && l.stage !== "Lost";

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Assigned to</th>
              <th className="px-4 py-3 font-medium">Follow-up</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-indigo-50/40">
                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                    <Avatar name={l.name} />
                    <div>
                      <Link href={`/leads/${l.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                        {l.name}
                      </Link>
                      <p className="text-xs text-slate-500">{l.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StageBadge stage={l.stage} />
                    <HealthBadge health={l.health} reasons={l.health_reasons} />
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{l.assignee?.name ?? "Unassigned"}</td>
                <td className="px-4 py-3">
                  <span className={isOverdue(l) ? "font-medium text-red-600" : "text-slate-600"}>
                    {formatDate(l.follow_up_date)}
                  </span>
                  {isOverdue(l) && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Overdue</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(l.budget)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <a href={`tel:${l.phone}`} aria-label={`Call ${l.name}`} data-tip="Call" className="rounded-lg bg-sky-50 p-2 text-sky-600 transition hover:scale-110 hover:bg-sky-100">
                      <Phone size={16} />
                    </a>
                    <a href={whatsappLink(l.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${l.name}`} data-tip="WhatsApp" className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:scale-110 hover:bg-emerald-100">
                      <MessageCircle size={16} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((l) => (
          <Link key={l.id} href={`/leads/${l.id}`} className="block rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-xs text-slate-500">{l.phone}</p>
              </div>
              <StageBadge stage={l.stage} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{l.assignee?.name ?? "Unassigned"}</span>
              <span className={isOverdue(l) ? "font-medium text-red-600" : ""}>
                {isOverdue(l) ? "Overdue: " : "Follow-up: "}
                {formatDate(l.follow_up_date)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function LeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);

  const q = useDebounce(search, 400).trim();

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (q) params.set("q", q);
  if (stage) params.set("stage", stage);
  if (followUp) params.set("follow_up", followUp);
  if (isAdmin && assignedTo) params.set("assigned_to", assignedTo);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["leads", params.toString()],
    queryFn: () => api<LeadListResponse>(`/api/leads?${params.toString()}`),
    placeholderData: keepPreviousData,
    enabled: !!user,
  });

  const salesUsers = useQuery({
    queryKey: ["sales-users"],
    queryFn: () => api<User[]>("/api/users/sales"),
    enabled: isAdmin,
  });

  const hasFilters = !!(q || stage || followUp || assignedTo);

  function clearFilters() {
    setSearch("");
    setStage("");
    setFollowUp("");
    setAssignedTo("");
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-slate-500">
            {data ? `${data.total} lead${data.total === 1 ? "" : "s"}` : "Manage your pipeline"}
          </p>
        </div>
        <button className={primaryBtn} onClick={() => setShowNew(true)}>
          <Plus size={16} /> New lead
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Search leads"
            placeholder="Search name, phone, email"
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          aria-label="Filter by stage"
          className={inputClass}
          value={stage}
          onChange={(e) => {
            setStage(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All stages</option>
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          aria-label="Filter by follow-up"
          className={inputClass}
          value={followUp}
          onChange={(e) => {
            setFollowUp(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Any follow-up</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
        </select>

        {isAdmin && (
          <select
            aria-label="Filter by assignee"
            className={inputClass}
            value={assignedTo}
            onChange={(e) => {
              setAssignedTo(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All sales users</option>
            {(salesUsers.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No leads match your filters" : "No leads yet"}
          description={
            hasFilters ? "Try changing or clearing the filters." : "Add your first lead to start tracking your pipeline."
          }
          action={
            hasFilters ? (
              <button className={secondaryBtn} onClick={clearFilters}>Clear filters</button>
            ) : (
              <button className={primaryBtn} onClick={() => setShowNew(true)}>
                <Plus size={16} /> New lead
              </button>
            )
          }
        />
      ) : (
        data && (
          <>
            <LeadsList items={data.items} />
            <Pagination page={data.page} pageSize={data.page_size} total={data.total} onChange={setPage} />
          </>
        )
      )}

      <NewLeadModal open={showNew} onClose={() => setShowNew(false)} isAdmin={!!isAdmin} salesUsers={salesUsers.data ?? []} />
    </div>
  );
}