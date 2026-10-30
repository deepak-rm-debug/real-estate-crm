"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin } from "lucide-react";

import { SkylineArt } from "@/components/ui/SkylineArt";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Project } from "@/lib/types";

const THEMES = [
  "from-indigo-600 to-indigo-900",
  "from-indigo-800 to-indigo-950",
  "from-gold-600 to-indigo-900",
];

export function PromoBanner() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<Project[]>("/api/projects"),
    enabled: !!user,
  });

  const slides = data ?? [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative min-h-[170px] overflow-hidden rounded-2xl text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((p, i) => {
        const active = i === index % slides.length;
        return (
          <div
            key={p.id}
            aria-hidden={!active}
            className={`absolute inset-0 bg-gradient-to-br ${THEMES[i % THEMES.length]} p-5 transition-opacity duration-700 ${
              active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <SkylineArt
              className={`absolute inset-x-0 bottom-0 h-20 w-full text-white/10 transition-transform duration-[5000ms] ease-linear ${
                active ? "scale-110" : "scale-100"
              }`}
            />
            <p className="text-[11px] font-medium uppercase tracking-widest text-gold-400">Featured project</p>
            <h2 className="font-heading mt-1 text-xl font-semibold">{p.name}</h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-indigo-100/80">
              <MapPin size={12} /> {p.location}
            </p>
            <p className="mt-3 text-sm text-indigo-50">
              {p.available_units} of {p.total_units} units available
            </p>
            <Link
              href="/properties"
              tabIndex={active ? 0 : -1}
              className="relative mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-medium text-indigo-950 transition hover:bg-gold-400"
            >
              Explore units <ArrowRight size={14} />
            </Link>
          </div>
        );
      })}

      {slides.length > 1 && (
        <div className="absolute bottom-3 right-4 z-10 flex gap-1.5">
          {slides.map((p, i) => (
            <button
              key={p.id}
              aria-label={`Show ${p.name}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index % slides.length ? "w-5 bg-gold-400" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}