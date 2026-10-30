"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bell, CalendarClock, Flame } from "lucide-react";

import { useClickOutside } from "@/hooks/useClickOutside";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/api/dashboard"),
    enabled: !!user,
    staleTime: 30_000,
  });

  const count = data ? data.overdue_count + data.today_count : 0;
  const hot = data?.priority_leads.filter((p) => p.health === "hot").slice(0, 3) ?? [];
  const nothing = !data || (data.overdue_followups.length + data.todays_followups.length + hot.length === 0);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${count ? `, ${count} pending` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
      >
        <Bell size={20} className={count > 0 && !open ? "animate-bell" : ""} />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="pop-in absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-slate-500">Follow-ups and leads that need attention</p>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {nothing ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">You are all caught up.</p>
            ) : (
              <ul className="space-y-0.5">
                {data?.overdue_followups.slice(0, 4).map((f) => (
                  <li key={`o-${f.id}`}>
                    <Link href={`/leads/${f.id}`} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-50">
                      <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                      <span className="min-w-0 text-sm">
                        <span className="block truncate font-medium">{f.name}</span>
                        <span className="text-xs text-red-600">Overdue since {formatDate(f.follow_up_date)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                {data?.todays_followups.slice(0, 4).map((f) => (
                  <li key={`t-${f.id}`}>
                    <Link href={`/leads/${f.id}`} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-50">
                      <CalendarClock size={16} className="mt-0.5 shrink-0 text-amber-500" />
                      <span className="min-w-0 text-sm">
                        <span className="block truncate font-medium">{f.name}</span>
                        <span className="text-xs text-slate-500">Follow-up today</span>
                      </span>
                    </Link>
                  </li>
                ))}
                {hot.map((p) => (
                  <li key={`h-${p.id}`}>
                    <Link href={`/leads/${p.id}`} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-50">
                      <Flame size={16} className="mt-0.5 shrink-0 text-orange-500" />
                      <span className="min-w-0 text-sm">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="text-xs text-slate-500">Hot lead · {p.reasons[0]}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}