import { AlertTriangle, Inbox } from "lucide-react";

import { secondaryBtn } from "./styles";

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/70" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <Inbox className="mb-3 text-slate-400" size={36} />
      <h3 className="font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 text-red-500" size={36} />
      <h3 className="font-medium text-red-900">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={`${secondaryBtn} mt-4`}>
          Try again
        </button>
      )}
    </div>
  );
}