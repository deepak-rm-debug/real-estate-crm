"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck, Loader2, Mail, MessageCircle, Pencil, Phone } from "lucide-react";
import { toast } from "sonner";

import { NewBookingModal } from "@/components/bookings/NewBookingModal";
import { EditLeadModal } from "@/components/leads/EditLeadModal";
import { Avatar } from "@/components/ui/Avatar";
import { StageBadge } from "@/components/ui/StageBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/States";
import { inputClass, primaryBtn, secondaryBtn } from "@/components/ui/styles";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate, formatDateTime, todayISO, whatsappLink } from "@/lib/format";
import { LEAD_STAGES, type ActivityItem, type LeadDetail, type User } from "@/lib/types";

function describe(a: ActivityItem): string {
  switch (a.action) {
    case "created":
      return "Lead created";
    case "stage_changed":
      return `Stage changed: ${a.old_value} → ${a.new_value}`;
    case "assigned":
      return `Assigned: ${a.old_value} → ${a.new_value}`;
    case "note_added":
      return `Note added: "${a.new_value}"`;
    case "follow_up_changed":
      return `Follow-up: ${a.old_value ?? "none"} → ${a.new_value ?? "none"}`;
    case "booked":
      return `Booked ${a.new_value}`;
    case "booking_cancelled":
      return "Booking cancelled, lead moved back to Negotiation";
    default:
      return a.action;
  }
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const qc = useQueryClient();

  const [note, setNote] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showBook, setShowBook] = useState(false);

  const lead = useQuery({
    queryKey: ["lead", id],
    queryFn: () => api<LeadDetail>(`/api/leads/${id}`),
    enabled: !!user && Number.isFinite(id),
  });

  const salesUsers = useQuery({
    queryKey: ["sales-users"],
    queryFn: () => api<User[]>("/api/users/sales"),
    enabled: isAdmin,
  });

  function refreshAll() {
    for (const key of ["lead", "leads", "dashboard", "bookings", "units", "projects", "buildings"]) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  }

  const stageMutation = useMutation({
    mutationFn: (stage: string) => api(`/api/leads/${id}/stage`, { method: "PATCH", body: { stage } }),
    onSuccess: () => {
      toast.success("Stage updated");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: (assigned_to: number) => api(`/api/leads/${id}/assign`, { method: "PATCH", body: { assigned_to } }),
    onSuccess: () => {
      toast.success("Lead reassigned");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const noteMutation = useMutation({
    mutationFn: () => api(`/api/leads/${id}/notes`, { method: "POST", body: { content: note.trim() } }),
    onSuccess: () => {
      toast.success("Note added");
      setNote("");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (lead.isLoading) return <ListSkeleton rows={4} />;

  if (lead.isError) {
    const notFound = lead.error instanceof ApiError && lead.error.status === 404;
    return notFound ? (
      <EmptyState
        title="Lead not found"
        description="It may have been removed, or it is assigned to someone else."
        action={<Link href="/leads" className={secondaryBtn}>Back to leads</Link>}
      />
    ) : (
      <ErrorState message={(lead.error as Error).message} onRetry={() => lead.refetch()} />
    );
  }

  const l = lead.data!;
  const isBooked = l.stage === "Booked";
  const isLost = l.stage === "Lost";
  const overdue = !!l.follow_up_date && l.follow_up_date < todayISO() && !isBooked && !isLost;

  return (
    <div>
      <Link href="/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> Back to leads
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={l.name} size="lg" />
            <h1 className="text-2xl font-semibold">{l.name}</h1>
            <StageBadge stage={l.stage} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {l.phone}</span>
            {l.email && <span className="inline-flex items-center gap-1.5"><Mail size={14} /> {l.email}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${l.phone}`} className={secondaryBtn}>
            <Phone size={14} /> Call
          </a>
          <a href={whatsappLink(l.phone)} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
            <MessageCircle size={14} /> WhatsApp
          </a>
          <button className={secondaryBtn} onClick={() => setShowEdit(true)}>
            <Pencil size={14} /> Edit
          </button>
          {!isBooked && !isLost && (
            <button className={primaryBtn} onClick={() => setShowBook(true)}>
              <CalendarCheck size={16} /> Book a unit
            </button>
          )}
          {isBooked && (
            <Link href="/bookings" className={secondaryBtn}>View booking</Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + notes */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Details</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Source</dt>
                <dd className="font-medium">{l.source ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Budget</dt>
                <dd className="font-medium">{formatCurrency(l.budget)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Follow-up</dt>
                <dd className={`font-medium ${overdue ? "text-red-600" : ""}`}>
                  {formatDate(l.follow_up_date)} {overdue && "(overdue)"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium">{formatDate(l.created_at)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Notes</h2>
            <form
              className="mb-4 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) noteMutation.mutate();
              }}
            >
              <textarea
                aria-label="Add a note"
                rows={3}
                maxLength={2000}
                placeholder="Called the customer, wants a 2BHK on a higher floor..."
                className={inputClass}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex justify-end">
                <button type="submit" className={primaryBtn} disabled={noteMutation.isPending || !note.trim()}>
                  {noteMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Add note
                </button>
              </div>
            </form>

            {l.notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {l.notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {n.user?.name ?? "Unknown"} · {formatDateTime(n.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: actions + timeline */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Manage</h2>

            <label htmlFor="stage" className="mb-1 block text-sm font-medium">Stage</label>
            <select
              id="stage"
              className={inputClass}
              value={l.stage}
              disabled={isBooked || stageMutation.isPending}
              onChange={(e) => stageMutation.mutate(e.target.value)}
            >
              {isBooked && <option value="Booked">Booked</option>}
              {LEAD_STAGES.filter((s) => s !== "Booked").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {isBooked ? (
              <p className="mt-1 text-xs text-slate-500">Cancel the booking to change the stage.</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Use &quot;Book a unit&quot; to move a lead to Booked.</p>
            )}

            <div className="mt-4">
              <label htmlFor="assignee" className="mb-1 block text-sm font-medium">Assigned to</label>
              {isAdmin ? (
                <select
                  id="assignee"
                  className={inputClass}
                  value={l.assigned_to ?? ""}
                  disabled={assignMutation.isPending}
                  onChange={(e) => assignMutation.mutate(Number(e.target.value))}
                >
                  {l.assigned_to === null && <option value="">Unassigned</option>}
                  {(salesUsers.data ?? []).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium">{l.assignee?.name ?? "Unassigned"}</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Activity</h2>
            {l.activities.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              <ol className="space-y-4 border-l border-slate-200 pl-4">
                {l.activities.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <p className="text-sm">{describe(a)}</p>
                    <p className="text-xs text-slate-500">
                      {a.user?.name ?? "System"} · {formatDateTime(a.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <EditLeadModal key={l.updated_at} open={showEdit} onClose={() => setShowEdit(false)} lead={l} />
      <NewBookingModal open={showBook} onClose={() => setShowBook(false)} defaultLeadId={l.id} />
    </div>
  );
}