

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, CalendarCheck, LayoutDashboard, Loader2, LogOut, Menu, Users } from "lucide-react";

import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-indigo-900 text-white">
      <Link href="/" className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-indigo-950">
          <Building2 size={20} />
        </div>
        <div className="leading-tight">
          <p className="font-heading text-lg font-semibold">Estate CRM</p>
          <p className="text-[11px] uppercase tracking-widest text-indigo-200/70">Sales workspace</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "border-gold-500 bg-white/15 font-semibold text-white shadow-sm"
                  : "border-transparent text-indigo-100/70 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-indigo-950">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-xs capitalize text-indigo-200/70">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition hover:bg-white/10"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 md:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 shadow-xl">{sidebar}</aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 hover:bg-slate-100">
          <Menu size={20} />
        </button>
        <span className="font-heading text-lg font-semibold">Estate CRM</span>
      </header>

      <main key={pathname} className="page-enter mx-auto max-w-6xl p-4 md:p-8">{children}</main>
    </div>
  );
}