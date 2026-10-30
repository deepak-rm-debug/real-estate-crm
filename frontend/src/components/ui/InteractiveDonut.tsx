"use client";

import { useEffect, useState } from "react";

interface Segment {
  label: string;
  value: number;
  stroke: string;
}

interface Props {
  segments: Segment[];
  centerValue: string;
  centerLabel: string;
}

const R = 42;
const C = 2 * Math.PI * R;

export function InteractiveDonut({ segments, centerValue, centerLabel }: Props) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  let offset = 0;
  const arcs = segments.map((s, i) => {
    const len = total ? (s.value / total) * C : 0;
    const arc = { ...s, i, len, offset };
    offset += len;
    return arc;
  });

  const active = hover !== null ? segments[hover] : null;
  const activePct = active && total ? Math.round((active.value / total) * 100) : 0;

  return (
    <div
      className="relative h-36 w-36 select-none"
      style={{
        transform: `perspective(600px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        setTilt({ x: px * 16, y: -py * 16 });
        setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseLeave={() => {
        setTilt({ x: 0, y: 0 });
        setTip(null);
        setHover(null);
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}
      >
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="12" className="stroke-slate-100" />
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            className={`${a.stroke} cursor-pointer`}
            strokeWidth={hover === a.i ? 16 : 12}
            strokeDasharray={`${ready ? a.len : 0} ${C}`}
            strokeDashoffset={-a.offset}
            style={{
              opacity: hover !== null && hover !== a.i ? 0.4 : 1,
              transition: "stroke-dasharray 0.9s ease-out, stroke-width 0.2s, opacity 0.2s",
            }}
            onMouseEnter={() => setHover(a.i)}
          />
        ))}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-semibold">{active ? active.value : centerValue}</span>
        <span className="text-[11px] text-slate-500">{active ? active.label : centerLabel}</span>
      </div>

      {tip && active && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-indigo-950 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: tip.x + 12, top: tip.y + 12 }}
        >
          {active.label}: {active.value} ({activePct}%)
        </div>
      )}
    </div>
  );
}