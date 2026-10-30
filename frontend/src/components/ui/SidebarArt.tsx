// const TOWERS = [
//   { x: 6, w: 52, h: 150 },
//   { x: 64, w: 46, h: 230 },
//   { x: 116, w: 58, h: 190 },
//   { x: 180, w: 42, h: 265 },
//   { x: 228, w: 28, h: 140 },
// ];

// export function SidebarArt({ className = "" }: { className?: string }) {
//   return (
//     <svg viewBox="0 0 256 320" className={className} aria-hidden="true">
//       <defs>
//         <pattern id="sa-win" width="12" height="16" patternUnits="userSpaceOnUse">
//           <rect x="3" y="4" width="6" height="8" rx="1" fill="#ffffff" />
//         </pattern>
//         <linearGradient id="sa-fade" x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0" stopColor="#fff" stopOpacity="0" />
//           <stop offset="0.6" stopColor="#fff" stopOpacity="1" />
//         </linearGradient>
//         <mask id="sa-mask">
//           <rect width="256" height="320" fill="url(#sa-fade)" />
//         </mask>
//       </defs>
//       <g mask="url(#sa-mask)">
//         {TOWERS.map((t) => (
//           <g key={t.x}>
//             <rect x={t.x} y={320 - t.h} width={t.w} height={t.h} fill="#ffffff" fillOpacity="0.07" />
//             <rect x={t.x} y={320 - t.h} width={t.w} height={t.h} fill="url(#sa-win)" fillOpacity="0.11" />
//           </g>
//         ))}
//       </g>
//     </svg>
//   );
// }


const TOWERS = [
  { x: 8, w: 35, h: 105 },
  { x: 48, w: 42, h: 145 },
  { x: 96, w: 31, h: 120 },
  { x: 133, w: 48, h: 185 },
  { x: 187, w: 29, h: 135 },
  { x: 220, w: 34, h: 95 },
];

export function SidebarArt({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 256 320"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Fade the skyline into the existing sidebar background */}
        <linearGradient
          id="skyline-fade"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#0b2b30" stopOpacity="0" />
          <stop offset="42%" stopColor="#0b2b30" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0b2b30" stopOpacity="0.95" />
        </linearGradient>

        {/* Dark teal building gradient */}
        <linearGradient
          id="building-fill"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#31545b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#071e24" stopOpacity="0.95" />
        </linearGradient>

        {/* Building windows */}
        <pattern
          id="skyline-windows"
          width="9"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="2"
            y="3"
            width="3"
            height="5"
            fill="#9bb9b9"
            opacity="0.3"
          />
        </pattern>

        {/* Building edge highlights */}
        <linearGradient
          id="building-edge"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="0%" stopColor="#8aaeb0" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#8aaeb0" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8aaeb0" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Background buildings */}
      <g opacity="0.9">
        {TOWERS.map((tower, index) => {
          const y = 320 - tower.h;

          return (
            <g key={tower.x}>
              <rect
                x={tower.x}
                y={y}
                width={tower.w}
                height={tower.h}
                fill="url(#building-fill)"
              />

              <rect
                x={tower.x}
                y={y}
                width={tower.w}
                height={tower.h}
                fill="url(#skyline-windows)"
              />

              <path
                d={`M ${tower.x} ${y} L ${tower.x + tower.w} ${y - 10} L ${tower.x + tower.w} 320`}
                fill="none"
                stroke="url(#building-edge)"
                strokeWidth="1"
              />

              <path
                d={`M ${tower.x} ${y} V 320`}
                stroke="#8aaeb0"
                strokeOpacity="0.2"
                strokeWidth="1"
              />

              {/* Highlight the tallest building */}
              {index === 3 && (
                <path
                  d={`M ${tower.x + 8} ${y} V ${y - 15} L ${tower.x + 18} ${y - 21} V ${y}`}
                  fill="#31545b"
                  opacity="0.5"
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Dark foreground landscape */}
      <path
        d="M0 275 Q45 255 82 275 T160 267 T256 270 V320 H0Z"
        fill="#071e24"
        opacity="0.65"
      />

      {/* Skyline landscape details */}
      <path
        d="M0 292 Q55 270 105 291 T205 285 T256 290"
        fill="none"
        stroke="#73999b"
        strokeOpacity="0.3"
        strokeWidth="1"
      />

      <path
        d="M0 307 Q70 290 130 307 T256 302"
        fill="none"
        stroke="#73999b"
        strokeOpacity="0.2"
        strokeWidth="1"
      />

      {/* Blend everything with the sidebar */}
      <rect
        width="256"
        height="320"
        fill="url(#skyline-fade)"
      />
    </svg>
  );
}
