import type { LeadStage } from "@/lib/types";

const STYLES: Record<LeadStage, string> = {
  New: "bg-slate-100 text-slate-700",
  Contacted: "bg-blue-100 text-blue-700",
  "Site Visit": "bg-violet-100 text-violet-700",
  Interested: "bg-amber-100 text-amber-700",
  Negotiation: "bg-orange-100 text-orange-700",
  Booked: "bg-emerald-100 text-emerald-700",
  Lost: "bg-red-100 text-red-700",
};

export function StageBadge({ stage }: { stage: LeadStage }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[stage]}`}>
      {stage}
    </span>
  );
}