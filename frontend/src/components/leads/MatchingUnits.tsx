"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { primaryBtn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Match } from "@/lib/types";

export function MatchingUnits({ leadId, onBook }: { leadId: number; onBook: (unitId: number) => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["matches", leadId],
    queryFn: () => api<Match[]>(`/api/leads/${leadId}/matches`),
  });

  return (
    <section className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        <Sparkles size={16} className="text-gold-500" /> Matching units
      </h2>
      <p className="mb-4 text-xs text-slate-500">Available units that fit this lead&apos;s budget and preferred type.</p>

      {isLoading ? (
        <div className="h-20 animate-pulse rounded-xl bg-slate-200/70" />
      ) : isError ? (
        <p className="text-sm text-red-600">Could not load matches.</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-slate-500">
          No matches yet. Add a budget or preferred type using Edit, or try a higher budget.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <div key={m.id} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <div>
                <p className="font-medium">{m.building_name} - {m.unit_number}</p>
                <p className="text-xs text-slate-500">{m.project_name}</p>
                <p className="mt-2 text-xs text-slate-600">{m.type} · {m.area_sqft} sqft · Floor {m.floor}</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(m.price)}</p>
                <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  {m.fit}
                </span>
              </div>
              <button className={`${primaryBtn} mt-3 w-full`} onClick={() => onBook(m.id)}>
                Book this unit
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}