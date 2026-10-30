import type { Lead } from "@/lib/types";

const STYLES = {
  hot: "bg-red-100 text-red-700",
  warm: "bg-amber-100 text-amber-700",
  cold: "bg-sky-100 text-sky-700",
};

const DOT = {
  hot: "bg-red-500",
  warm: "bg-amber-500",
  cold: "bg-sky-500",
};

export function HealthBadge({ health, reasons }: { health: Lead["health"] | undefined; reasons?: string[] }) {
  if (!health) return null;
  return (
    <span
      title={reasons?.length ? reasons.join(" · ") : undefined}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[health]}`}
    >
      <i className={`h-1.5 w-1.5 rounded-full ${DOT[health]}`} />
      {health}
    </span>
  );
}