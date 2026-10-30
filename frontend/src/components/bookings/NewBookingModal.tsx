"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { inputClass, primaryBtn, secondaryBtn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Booking, LeadListResponse, UnitListResponse } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultLeadId?: number;
  defaultUnitId?: number;
}

export function NewBookingModal({ open, onClose, defaultLeadId, defaultUnitId }: Props) {
  const qc = useQueryClient();
  const [leadId, setLeadId] = useState(defaultLeadId ? String(defaultLeadId) : "");
  const [unitId, setUnitId] = useState(defaultUnitId ? String(defaultUnitId) : "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const leads = useQuery({
    queryKey: ["leads", "bookable"],
    queryFn: () => api<LeadListResponse>("/api/leads?page_size=200"),
    enabled: open,
  });
  const units = useQuery({
    queryKey: ["units", "available-all"],
    queryFn: () => api<UnitListResponse>("/api/units?status=available&page_size=200"),
    enabled: open,
  });

  const bookableLeads = (leads.data?.items ?? []).filter((l) => l.stage !== "Booked" && l.stage !== "Lost");
  const selectedUnit = units.data?.items.find((u) => String(u.id) === unitId);

  const mutation = useMutation({
    mutationFn: () =>
      api<Booking>("/api/bookings", {
        method: "POST",
        body: { lead_id: Number(leadId), unit_id: Number(unitId), amount: amount ? Number(amount) : null },
      }),
    onSuccess: () => {
      toast.success("Booking confirmed");
      for (const key of ["bookings", "leads", "units", "projects", "buildings", "dashboard"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      setUnitId("");
      setAmount("");
      setError("");
      onClose();
    },
    onError: (e: Error) => {
      setError(e.message);
      // someone else may have taken the unit, refresh the available list
      qc.invalidateQueries({ queryKey: ["units"] });
    },
  });

  return (
    <Modal open={open} title="New booking" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          mutation.mutate();
        }}
      >
        <Field label="Lead *" htmlFor="bk-lead">
          <select id="bk-lead" required className={inputClass} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">{leads.isLoading ? "Loading leads..." : "Select lead"}</option>
            {bookableLeads.map((l) => (
              <option key={l.id} value={l.id}>{l.name} ({l.stage})</option>
            ))}
          </select>
        </Field>

        <Field label="Unit *" htmlFor="bk-unit">
          <select
            id="bk-unit"
            required
            className={inputClass}
            value={unitId}
            onChange={(e) => {
              setUnitId(e.target.value);
              setAmount("");
            }}
          >
            <option value="">{units.isLoading ? "Loading units..." : "Select available unit"}</option>
            {(units.data?.items ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.project_name} · {u.building_name}-{u.unit_number} · {u.type} · {formatCurrency(u.price)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Booking amount (INR)" htmlFor="bk-amount">
          <input
            id="bk-amount"
            type="number"
            min={1}
            className={inputClass}
            placeholder={selectedUnit ? `Default: ${selectedUnit.price}` : "Defaults to unit price"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>

        {(leads.isError || units.isError) && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Could not load leads or units. Close and try again.</p>
        )}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={secondaryBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryBtn} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Confirm booking
          </button>
        </div>
      </form>
    </Modal>
  );
}