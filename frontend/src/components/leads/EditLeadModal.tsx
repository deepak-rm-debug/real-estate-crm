"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { inputClass, primaryBtn, secondaryBtn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import type { Lead } from "@/lib/types";

const SOURCES = ["Website", "Referral", "Walk-in", "Facebook Ad", "Google Ad", "Other"];

interface Props {
  open: boolean;
  onClose: () => void;
  lead: Lead;
}

export function EditLeadModal({ open, onClose, lead }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? "",
    source: lead.source ?? "",
    budget: lead.budget ? String(Number(lead.budget)) : "",
    follow_up_date: lead.follow_up_date ?? "",
    preferred_type: lead.preferred_type ?? "",
  });
  const [error, setError] = useState("");

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      api(`/api/leads/${lead.id}`, {
        method: "PUT",
        body: {
          name: form.name.trim(),
          phone: form.phone,
          email: form.email || null,
          source: form.source || null,
          preferred_type: form.preferred_type || null,
          budget: form.budget ? Number(form.budget) : null,
          follow_up_date: form.follow_up_date || null,
        },
      }),
    onSuccess: () => {
      toast.success("Lead updated");
      for (const key of ["lead", "leads", "dashboard", "matches"]) qc.invalidateQueries({ queryKey: [key] });
      setError("");
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Modal open={open} title="Edit lead" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          mutation.mutate();
        }}
      >
        <Field label="Name *" htmlFor="e-name">
          <input id="e-name" required minLength={2} className={inputClass} value={form.name} onChange={set("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone *" htmlFor="e-phone">
            <input id="e-phone" required inputMode="tel" className={inputClass} value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Email" htmlFor="e-email">
            <input id="e-email" type="email" className={inputClass} value={form.email} onChange={set("email")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Source" htmlFor="e-source">
            <select id="e-source" className={inputClass} value={form.source} onChange={set("source")}>
              <option value="">Select source</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Budget (INR)" htmlFor="e-budget">
            <input id="e-budget" type="number" min={0} className={inputClass} value={form.budget} onChange={set("budget")} />
          </Field>
        </div>
        <Field label="Follow-up date" htmlFor="e-follow">
          <input id="e-follow" type="date" className={inputClass} value={form.follow_up_date} onChange={set("follow_up_date")} />
        </Field>

        <Field label="Preferred type" htmlFor="e-type">
          <select id="e-type" className={inputClass} value={form.preferred_type} onChange={set("preferred_type")}>
            <option value="">Not decided</option>
            {["1BHK", "2BHK", "3BHK", "Villa"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={secondaryBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryBtn} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}