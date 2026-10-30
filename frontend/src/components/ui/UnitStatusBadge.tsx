import type { UnitStatus } from "@/lib/types";

const STYLES: Record<UnitStatus, string> = {
  available: "bg-emerald-100 text-emerald-700",
  held: "bg-amber-100 text-amber-700",
  booked: "bg-slate-200 text-slate-700",
};

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}>
      {status}
    </span>
  );
}