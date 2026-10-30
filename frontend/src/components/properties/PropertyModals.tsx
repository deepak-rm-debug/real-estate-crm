"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { inputClass, primaryBtn, secondaryBtn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import type { Building } from "@/lib/types";

function Actions({ onClose, pending, label }: { onClose: () => void; pending: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" className={secondaryBtn} onClick={onClose}>Cancel</button>
      <button type="submit" className={primaryBtn} disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        {label}
      </button>
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>;
}

function useRefreshProperties() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["buildings"] });
    qc.invalidateQueries({ queryKey: ["units"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

/* ---------------- Project ---------------- */
export function AddProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const refresh = useRefreshProperties();
  const [form, setForm] = useState({ name: "", location: "", description: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api("/api/projects", {
        method: "POST",
        body: { name: form.name.trim(), location: form.location.trim(), description: form.description.trim() || null },
      }),
    onSuccess: () => {
      toast.success("Project added");
      refresh();
      setForm({ name: "", location: "", description: "" });
      setError("");
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Modal open={open} title="Add project" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          mutation.mutate();
        }}
      >
        <Field label="Project name *" htmlFor="p-name">
          <input id="p-name" required minLength={2} className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Location *" htmlFor="p-loc">
          <input id="p-loc" required minLength={2} className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </Field>
        <Field label="Description" htmlFor="p-desc">
          <input id="p-desc" className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <ErrorLine message={error} />
        <Actions onClose={onClose} pending={mutation.isPending} label="Add project" />
      </form>
    </Modal>
  );
}

/* ---------------- Building ---------------- */
export function AddBuildingModal({
  open,
  onClose,
  projectId,
  projectName,
}: {
  open: boolean;
  onClose: () => void;
  projectId: number | null;
  projectName: string;
}) {
  const refresh = useRefreshProperties();
  const [form, setForm] = useState({ name: "", total_floors: "1" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/projects/${projectId}/buildings`, {
        method: "POST",
        body: { name: form.name.trim(), total_floors: Number(form.total_floors) },
      }),
    onSuccess: () => {
      toast.success("Building added");
      refresh();
      setForm({ name: "", total_floors: "1" });
      setError("");
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Modal open={open} title={`Add building to ${projectName}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          mutation.mutate();
        }}
      >
        <Field label="Building name *" htmlFor="b-name">
          <input id="b-name" required className={inputClass} placeholder="Tower C" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Total floors *" htmlFor="b-floors">
          <input id="b-floors" type="number" min={1} max={200} required className={inputClass} value={form.total_floors} onChange={(e) => setForm({ ...form, total_floors: e.target.value })} />
        </Field>
        <ErrorLine message={error} />
        <Actions onClose={onClose} pending={mutation.isPending} label="Add building" />
      </form>
    </Modal>
  );
}

/* ---------------- Unit ---------------- */
const UNIT_TYPES = ["1BHK", "2BHK", "3BHK", "Villa"];
const EMPTY_UNIT = { building_id: "", unit_number: "", floor: "1", type: "2BHK", area_sqft: "", price: "" };

export function AddUnitModal({
  open,
  onClose,
  buildings,
  defaultBuildingId,
}: {
  open: boolean;
  onClose: () => void;
  buildings: Building[];
  defaultBuildingId?: string;
}) {
  const refresh = useRefreshProperties();
  const [form, setForm] = useState(EMPTY_UNIT);
  const [error, setError] = useState("");

  const buildingId = form.building_id || defaultBuildingId || "";
  const set = (key: keyof typeof EMPTY_UNIT) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/buildings/${buildingId}/units`, {
        method: "POST",
        body: {
          unit_number: form.unit_number.trim(),
          floor: Number(form.floor),
          type: form.type,
          area_sqft: Number(form.area_sqft || 0),
          price: Number(form.price),
        },
      }),
    onSuccess: () => {
      toast.success("Unit added");
      refresh();
      setForm(EMPTY_UNIT);
      setError("");
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Modal open={open} title="Add unit" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          if (!buildingId) {
            setError("Select a building");
            return;
          }
          mutation.mutate();
        }}
      >
        <Field label="Building *" htmlFor="u-building">
          <select id="u-building" className={inputClass} value={buildingId} onChange={set("building_id")}>
            <option value="">Select building</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Unit number *" htmlFor="u-number">
            <input id="u-number" required className={inputClass} placeholder="401" value={form.unit_number} onChange={set("unit_number")} />
          </Field>
          <Field label="Floor" htmlFor="u-floor">
            <input id="u-floor" type="number" min={0} className={inputClass} value={form.floor} onChange={set("floor")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type *" htmlFor="u-type">
            <select id="u-type" className={inputClass} value={form.type} onChange={set("type")}>
              {UNIT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Area (sqft)" htmlFor="u-area">
            <input id="u-area" type="number" min={0} className={inputClass} value={form.area_sqft} onChange={set("area_sqft")} />
          </Field>
        </div>
        <Field label="Price (INR) *" htmlFor="u-price">
          <input id="u-price" type="number" min={1} required className={inputClass} value={form.price} onChange={set("price")} />
        </Field>
        <ErrorLine message={error} />
        <Actions onClose={onClose} pending={mutation.isPending} label="Add unit" />
      </form>
    </Modal>
  );
}