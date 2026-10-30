const TOWERS = [
  { x: 6, w: 52, h: 150 },
  { x: 64, w: 46, h: 230 },
  { x: 116, w: 58, h: 190 },
  { x: 180, w: 42, h: 265 },
  { x: 228, w: 28, h: 140 },
];

export function SidebarArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 320" className={className} aria-hidden="true">
      <defs>
        <pattern id="sa-win" width="12" height="16" patternUnits="userSpaceOnUse">
          <rect x="3" y="4" width="6" height="8" rx="1" fill="#ffffff" />
        </pattern>
        <linearGradient id="sa-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="sa-mask">
          <rect width="256" height="320" fill="url(#sa-fade)" />
        </mask>
      </defs>
      <g mask="url(#sa-mask)">
        {TOWERS.map((t) => (
          <g key={t.x}>
            <rect x={t.x} y={320 - t.h} width={t.w} height={t.h} fill="#ffffff" fillOpacity="0.07" />
            <rect x={t.x} y={320 - t.h} width={t.w} height={t.h} fill="url(#sa-win)" fillOpacity="0.11" />
          </g>
        ))}
      </g>
    </svg>
  );
}