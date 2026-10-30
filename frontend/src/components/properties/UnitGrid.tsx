"use client";

import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/States";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Unit, UnitListResponse, UnitStatus } from "@/lib/types";

const CELL: Record<UnitStatus, string> = {
  available: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:shadow cursor-pointer",
  held: "border-amber-300 bg-amber-50 text-amber-900 cursor-not-allowed",
  booked: "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed",
};

interface Props {
  projectId: number | null;
  buildingId: string;
  onPick: (unitId: number) => void;
}

export function UnitGrid({ projectId, buildingId, onPick }: Props) {
  const params = new URLSearchParams({ page_size: "200" });
  if (projectId) params.set("project_id", String(projectId));
  if (buildingId) params.set("building_id", buildingId);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["units", "grid", params.toString()],
    queryFn: () => api<UnitListResponse>(`/api/units?${params.toString()}`),
    enabled: projectId !== null,
  });

  if (projectId === null) {
    return (
      <EmptyState
        title="Select a project"
        description="Pick a project card above to see its floor-wise availability."
      />
    );
  }
  if (isLoading) return <ListSkeleton />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="No units to show" description="This selection has no units yet." />;
  }

  const buildings = new Map<number, { title: string; floors: Map<number, Unit[]> }>();
  for (const u of data.items) {
    if (!buildings.has(u.building_id)) {
      buildings.set(u.building_id, { title: `${u.project_name} · ${u.building_name}`, floors: new Map() });
    }
    const b = buildings.get(u.building_id)!;
    b.floors.set(u.floor, [...(b.floors.get(u.floor) ?? []), u]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50" /> Available (click to book)</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-amber-300 bg-amber-50" /> Held</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-slate-200 bg-slate-100" /> Booked</span>
      </div>

      {[...buildings.entries()].map(([id, b]) => {
        const all = [...b.floors.values()].flat();
        const free = all.filter((u) => u.status === "available").length;
        return (
          <section key={id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{b.title}</h3>
              <span className="text-sm text-emerald-700">{free}/{all.length} available</span>
            </div>
            <div className="space-y-2">
              {[...b.floors.entries()]
                .sort((a, c) => c[0] - a[0])
                .map(([floor, units]) => (
                  <div key={floor} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-xs font-medium text-slate-500">Floor {floor}</span>
                    <div className="flex flex-wrap gap-2">
                      {units.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          disabled={u.status !== "available"}
                          onClick={() => onPick(u.id)}
                          title={`${u.type} · ${u.area_sqft} sqft · ${formatCurrency(u.price)} · ${u.status}`}
                          className={`w-24 rounded-lg border px-2 py-1.5 text-left transition ${CELL[u.status]}`}
                        >
                          <span className="block text-sm font-semibold">{u.unit_number}</span>
                          <span className="block text-[11px]">{u.type} · {formatCurrency(u.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}