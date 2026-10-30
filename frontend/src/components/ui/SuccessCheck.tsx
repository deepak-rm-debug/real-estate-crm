export function SuccessCheck({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div role="status" className="flex flex-col items-center py-6 text-center">
      <svg viewBox="0 0 52 52" className="h-20 w-20" aria-hidden="true">
        <circle className="check-circle" cx="26" cy="26" r="24" fill="none" strokeWidth="3" />
        <path className="check-mark" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-17" />
      </svg>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}