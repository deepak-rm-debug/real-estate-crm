"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { primaryBtn, secondaryBtn } from "@/components/ui/styles";

const REASONS = [
  "Price too high",
  "Location not suitable",
  "Chose a competitor",
  "No response",
  "Not interested",
  "Other",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
}

export function LostReasonModal({ open, onClose, onConfirm, pending }: Props) {
  const [reason, setReason] = useState("");

  return (
    <Modal open={open} title="Why was this lead lost?" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (reason) onConfirm(reason);
        }}
      >
        <p className="text-sm text-slate-500">This helps the team understand what to improve.</p>
        <fieldset className="space-y-2">
          <legend className="sr-only">Reason for losing the lead</legend>
          {REASONS.map((r) => (
            <label
              key={r}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition hover:bg-slate-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
            >
              <input type="radio" name="lost-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
              {r}
            </label>
          ))}
        </fieldset>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={secondaryBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryBtn} disabled={!reason || pending}>
            {pending && <Loader2 size={16} className="animate-spin" />}
            Mark as lost
          </button>
        </div>
      </form>
    </Modal>
  );
}