"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@/components/ui/Modal";
import { inputClass, primaryBtn, secondaryBtn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import type { Lead, User } from "@/lib/types";

const SOURCES = ["Website", "Referral", "Walk-in", "Facebook Ad", "Google Ad", "Other"];

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  source: "",
  budget: "",
  follow_up_date: "",
  assigned_to: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  salesUsers: User[];
}

export function NewLeadModal({ open, onClose, isAdmin, salesUsers }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const set =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      api<Lead>("/api/leads", {
        method: "POST",
        body: {
          name: form.name.trim(),
          phone: form.phone,
          email: form.email || null,
          source: form.source || null,
          budget: form.budget ? Number(form.budget) : null,
          follow_up_date: form.follow_up_date || null,
          assigned_to: isAdmin && form.assigned_to ? Number(form.assigned_to) : null,
        },
      }),
    onSuccess: () => {
      toast.success("Lead created");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setForm(EMPTY);
      setError("");
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Modal open={open} title="New lead" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="lead-name" className="mb-1 block text-sm font-medium">Name *</label>
          <input id="lead-name" required minLength={2} className={inputClass} value={form.name} onChange={set("name")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-phone" className="mb-1 block text-sm font-medium">Phone *</label>
            <input id="lead-phone" required inputMode="tel" placeholder="9876500000" className={inputClass} value={form.phone} onChange={set("phone")} />
          </div>
          <div>
            <label htmlFor="lead-email" className="mb-1 block text-sm font-medium">Email</label>
            <input id="lead-email" type="email" className={inputClass} value={form.email} onChange={set("email")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-source" className="mb-1 block text-sm font-medium">Source</label>
            <select id="lead-source" className={inputClass} value={form.source} onChange={set("source")}>
              <option value="">Select source</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lead-budget" className="mb-1 block text-sm font-medium">Budget (INR)</label>
            <input id="lead-budget" type="number" min={0} className={inputClass} value={form.budget} onChange={set("budget")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-followup" className="mb-1 block text-sm font-medium">Follow-up date</label>
            <input id="lead-followup" type="date" className={inputClass} value={form.follow_up_date} onChange={set("follow_up_date")} />
          </div>
          {isAdmin && (
            <div>
              <label htmlFor="lead-assignee" className="mb-1 block text-sm font-medium">Assign to</label>
              <select id="lead-assignee" className={inputClass} value={form.assigned_to} onChange={set("assigned_to")}>
                <option value="">Me</option>
                {salesUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={secondaryBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryBtn} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Create lead
          </button>
        </div>
      </form>
    </Modal>
  );
}