"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";

import { AddBuildingModal, AddProjectModal, AddUnitModal } from "@/components/properties/PropertyModals";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/States";
import { inputClass, primaryBtn, secondaryBtn } from "@/components/ui/styles";
import { UnitStatusBadge } from "@/components/ui/UnitStatusBadge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import type { Building, Project, Unit, UnitListResponse } from "@/lib/types";

const PAGE_SIZE = 12;

function UnitsList({ items }: { items: Unit[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Floor</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.building_name} - {u.unit_number}</p>
                  <p className="text-xs text-slate-500">{u.project_name}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.type}</td>
                <td className="px-4 py-3 text-slate-600">{u.floor}</td>
                <td className="px-4 py-3 text-slate-600">{u.area_sqft} sqft</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(u.price)}</td>
                <td className="px-4 py-3"><UnitStatusBadge status={u.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((u) => (
          <div key={u.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{u.building_name} - {u.unit_number}</p>
                <p className="text-xs text-slate-500">{u.project_name}</p>
              </div>
              <UnitStatusBadge status={u.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{u.type} · Floor {u.floor} · {u.area_sqft} sqft</span>
              <span className="font-medium text-slate-700">{formatCurrency(u.price)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [projectId, setProjectId] = useState<number | null>(null);
  const [buildingId, setBuildingId] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"project" | "building" | "unit" | null>(null);

  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<Project[]>("/api/projects"),
    enabled: !!user,
  });

  const buildings = useQuery({
    queryKey: ["buildings", projectId],
    queryFn: () => api<Building[]>(`/api/projects/${projectId}/buildings`),
    enabled: !!user && projectId !== null,
  });

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (projectId) params.set("project_id", String(projectId));
  if (buildingId) params.set("building_id", buildingId);
  if (type) params.set("type", type);
  if (status) params.set("status", status);

  const units = useQuery({
    queryKey: ["units", params.toString()],
    queryFn: () => api<UnitListResponse>(`/api/units?${params.toString()}`),
    placeholderData: keepPreviousData,
    enabled: !!user,
  });

  const selectedProject = projects.data?.find((p) => p.id === projectId);
  const hasFilters = !!(projectId || buildingId || type || status);

  function selectProject(id: number) {
    setProjectId((current) => (current === id ? null : id));
    setBuildingId("");
    setPage(1);
  }

  function clearFilters() {
    setProjectId(null);
    setBuildingId("");
    setType("");
    setStatus("");
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Properties</h1>
          <p className="text-sm text-slate-500">Projects, buildings and units</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button className={secondaryBtn} onClick={() => setModal("project")}>
              <Plus size={16} /> Project
            </button>
            <button className={secondaryBtn} disabled={projectId === null} onClick={() => setModal("building")} title={projectId === null ? "Select a project first" : ""}>
              <Plus size={16} /> Building
            </button>
            <button className={primaryBtn} disabled={projectId === null} onClick={() => setModal("unit")} title={projectId === null ? "Select a project first" : ""}>
              <Plus size={16} /> Unit
            </button>
          </div>
        )}
      </div>

      {/* Projects */}
      {projects.isLoading ? (
        <ListSkeleton rows={2} />
      ) : projects.isError ? (
        <ErrorState message={(projects.error as Error).message} onRetry={() => projects.refetch()} />
      ) : projects.data && projects.data.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={isAdmin ? "Add your first project to start listing units." : "An admin needs to add projects first."}
          action={isAdmin ? <button className={primaryBtn} onClick={() => setModal("project")}><Plus size={16} /> Add project</button> : undefined}
        />
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data?.map((p) => {
            const active = p.id === projectId;
            return (
              <button
                key={p.id}
                aria-pressed={active}
                onClick={() => selectProject(p.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="font-semibold">{p.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={12} /> {p.location}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span>{p.building_count} buildings</span>
                  <span className="font-medium text-emerald-700">{p.available_units}/{p.total_units} available</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <select
          aria-label="Filter by building"
          className={inputClass}
          value={buildingId}
          disabled={projectId === null}
          onChange={(e) => {
            setBuildingId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{projectId === null ? "Select a project for buildings" : "All buildings"}</option>
          {(buildings.data ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          aria-label="Filter by type"
          className={inputClass}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All types</option>
          {["1BHK", "2BHK", "3BHK", "Villa"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          className={inputClass}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="held">Held</option>
          <option value="booked">Booked</option>
        </select>
      </div>

      {/* Units */}
      {units.isLoading ? (
        <ListSkeleton />
      ) : units.isError ? (
        <ErrorState message={(units.error as Error).message} onRetry={() => units.refetch()} />
      ) : units.data && units.data.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No units match your filters" : "No units yet"}
          description={hasFilters ? "Try changing or clearing the filters." : "Units you add will show up here."}
          action={hasFilters ? <button className={secondaryBtn} onClick={clearFilters}>Clear filters</button> : undefined}
        />
      ) : (
        units.data && (
          <>
            <UnitsList items={units.data.items} />
            <Pagination page={units.data.page} pageSize={units.data.page_size} total={units.data.total} onChange={setPage} />
          </>
        )
      )}

      <AddProjectModal open={modal === "project"} onClose={() => setModal(null)} />
      <AddBuildingModal
        open={modal === "building"}
        onClose={() => setModal(null)}
        projectId={projectId}
        projectName={selectedProject?.name ?? ""}
      />
      <AddUnitModal
        open={modal === "unit"}
        onClose={() => setModal(null)}
        buildings={buildings.data ?? []}
        defaultBuildingId={buildingId}
      />
    </div>
  );
}