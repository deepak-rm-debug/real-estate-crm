"use client";

import { useEffect, useState } from "react";

import { useCountUp } from "@/hooks/useCountUp";

export function AnimatedNumber({ value }: { value: number }) {
  const v = useCountUp(value);
  return <>{v}</>;
}

interface BarProps {
  pct: number;
  className?: string;
  delay?: number;
}

/** Only the coloured fill: grows from 0 to pct when it appears. */
export function BarFill({ pct, className = "bg-indigo-500", delay = 0 }: BarProps) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(pct), 40);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div
      className={`h-full rounded-full transition-[width] duration-700 ease-out ${className}`}
      style={{ width: `${w}%`, transitionDelay: `${delay}ms` }}
    />
  );
}

export function AnimatedBar(props: BarProps) {
  return (
    <div className="h-2 origin-center overflow-hidden rounded-full bg-slate-100 transition-transform duration-200 hover:scale-y-150">
      <BarFill {...props} />
    </div>
  );
}