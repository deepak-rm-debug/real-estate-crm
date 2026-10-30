"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { NewBookingModal } from "@/components/bookings/NewBookingModal";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/States";
import { inputClass, primaryBtn, secondaryBtn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Booking } from "@/lib/types";

function StatusPill({ status }: { status: Booking["status"] }) {
  const style = status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>{status}</span>;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["bookings", status],
    queryFn: () => api<Booking[]>(`/api/bookings${status ? `?status=${status}` : ""}`),
    enabled: !!user,
  });

  const cancel = useMutation({
    mutationFn: (id: number) => api<Booking>(`/api/bookings/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Booking cancelled, unit is available again");
      for (const key of ["bookings", "leads", "units", "projects", "buildings", "dashboard"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function confirmCancel(b: Booking) {
    if (window.confirm(`Cancel booking for ${b.lead_name} (${b.unit_label})? The unit will become available again.`)) {
      cancel.mutate(b.id);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <p className="text-sm text-slate-500">{data ? `${data.length} booking${data.length === 1 ? "" : "s"}` : "Unit bookings"}</p>
        </div>
        <div className="flex gap-2">
          <select aria-label="Filter by status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All bookings</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className={`${primaryBtn} whitespace-nowrap`} onClick={() => setShowNew(true)}>
            <Plus size={16} /> New booking
          </button>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : data && data.length === 0 ? (
        <EmptyState
          title={status ? "No bookings with this status" : "No bookings yet"}
          description="Book an available unit for a lead to see it here."
          action={
            status ? (
              <button className={secondaryBtn} onClick={() => setStatus("")}>Clear filter</button>
            ) : (
              <button className={primaryBtn} onClick={() => setShowNew(true)}><Plus size={16} /> New booking</button>
            )
          }
        />
      ) : (
        data && (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Lead</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Booked by</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/leads/${b.lead_id}`} className="font-medium hover:text-indigo-600">{b.lead_name}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <p>{b.unit_label}</p>
                        <p className="text-xs text-slate-500">{b.project_name}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(b.amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{b.booked_by_name}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(b.created_at)}</td>
                      <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {b.status === "active" && (
                          <button className="text-sm font-medium text-red-600 hover:underline" disabled={cancel.isPending} onClick={() => confirmCancel(b)}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {data.map((b) => (
                <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/leads/${b.lead_id}`} className="font-medium">{b.lead_name}</Link>
                      <p className="text-xs text-slate-500">{b.unit_label} · {b.project_name}</p>
                    </div>
                    <StatusPill status={b.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatCurrency(b.amount)} · {formatDate(b.created_at)}</span>
                    {b.status === "active" && (
                      <button className="font-medium text-red-600" disabled={cancel.isPending} onClick={() => confirmCancel(b)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      <NewBookingModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}