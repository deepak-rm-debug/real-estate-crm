export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} role="img" aria-label="Estate CRM">
      <defs>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6bd6c" />
          <stop offset="1" stopColor="#b8862f" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#logo-gold)" />
      <rect x="12" y="11" width="15" height="26" rx="2" fill="#0f323b" />
      <rect x="29" y="22" width="8" height="15" rx="2" fill="#0f323b" opacity="0.78" />
      <g fill="#e8c27a">
        <rect x="16" y="16" width="3" height="3" rx="0.6" />
        <rect x="21" y="16" width="3" height="3" rx="0.6" />
        <rect x="16" y="22" width="3" height="3" rx="0.6" />
        <rect x="21" y="22" width="3" height="3" rx="0.6" />
        <rect x="16" y="28" width="3" height="3" rx="0.6" />
        <rect x="21" y="28" width="3" height="3" rx="0.6" />
        <rect x="31.5" y="26" width="3" height="3" rx="0.6" />
        <rect x="31.5" y="31" width="3" height="3" rx="0.6" />
      </g>
    </svg>
  );
}