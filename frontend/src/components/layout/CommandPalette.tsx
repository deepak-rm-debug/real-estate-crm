"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building2, CalendarCheck, CornerDownLeft, Home, LayoutDashboard, Loader2, Search, Users } from "lucide-react";

import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface SearchData {
  leads: { id: number; name: string; phone: string; stage: string }[];
  projects: { id: number; name: string; location: string }[];
  units: { id: number; label: string; project_name: string; type: string; price: string; status: string }[];
}

interface Item {
  key: string;
  group: string;
  label: string;
  hint: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

const PAGES: (Item & { adminOnly?: boolean })[] = [
  { key: "p-dash", group: "Go to", label: "Dashboard", hint: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "p-leads", group: "Go to", label: "Leads", hint: "Pipeline", href: "/leads", icon: Users },
  { key: "p-props", group: "Go to", label: "Properties", hint: "Projects and units", href: "/properties", icon: Building2 },
  { key: "p-book", group: "Go to", label: "Bookings", hint: "Unit bookings", href: "/bookings", icon: CalendarCheck },
  { key: "p-ins", group: "Go to", label: "Insights", hint: "Sources, lost reasons, scorecard", href: "/insights", icon: BarChart3, adminOnly: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export function CommandPalette({ open, onClose, isAdmin }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const term = useDebounce(q, 250).trim();

  const results = useQuery({
    queryKey: ["search", term],
    queryFn: () => api<SearchData>(`/api/search?q=${encodeURIComponent(term)}`),
    enabled: open && term.length >= 2,
  });

  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setActive(0), [term]);

  const items = useMemo<Item[]>(() => {
    if (term.length < 2) return PAGES.filter((p) => !p.adminOnly || isAdmin);
    const d = results.data;
    if (!d) return [];
    return [
      ...d.leads.map((l) => ({
        key: `l-${l.id}`, group: "Leads", label: l.name, hint: `${l.phone} · ${l.stage}`, href: `/leads/${l.id}`, icon: Users,
      })),
      ...d.projects.map((p) => ({
        key: `pr-${p.id}`, group: "Projects", label: p.name, hint: p.location, href: "/properties", icon: Building2,
      })),
      ...d.units.map((u) => ({
        key: `u-${u.id}`, group: "Units", label: u.label,
        hint: `${u.project_name} · ${u.type} · ${formatCurrency(u.price)} · ${u.status}`,
        href: "/properties", icon: Home,
      })),
    ];
  }, [term, results.data, isAdmin]);

  const waiting = q.trim().length >= 2 && (term !== q.trim() || results.isFetching);

  function go(item: Item) {
    router.push(item.href);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="overlay-in fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onClick={(e) => e.stopPropagation()}
        className="pop-in w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ transformOrigin: "top center" }}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search leads, projects, units..."
            aria-label="Search"
            className="w-full bg-transparent py-4 text-sm outline-none"
          />
          {waiting && <Loader2 size={16} className="animate-spin text-slate-400" />}
          <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500 sm:block">Esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {term.length >= 2 && !waiting && items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">No matches for &quot;{term}&quot;</p>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const showGroup = items[idx - 1]?.group !== item.group;
              return (
                <div key={item.key}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">{item.group}</p>
                  )}
                  <button
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      idx === active ? "bg-indigo-50 text-indigo-900" : "text-slate-700"
                    }`}
                  >
                    <Icon size={16} className="shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                      <span className="block truncate text-xs text-slate-500">{item.hint}</span>
                    </span>
                    {idx === active && <CornerDownLeft size={14} className="shrink-0 text-slate-400" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
          <span>Up / Down to move, Enter to open</span>
          <span>Ctrl K to toggle</span>
        </div>
      </div>
    </div>
  );
}