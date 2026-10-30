"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Building2, CalendarCheck, LayoutDashboard, Loader2, LogOut, Menu, Search, Users } from "lucide-react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { Logo } from "@/components/ui/Logo";
import { SidebarArt } from "@/components/ui/SidebarArt";
import { useCardEffects } from "@/hooks/useCardEffects";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/leads", label: "Leads", icon: Users, adminOnly: false },
  { href: "/properties", label: "Properties", icon: Building2, adminOnly: false },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck, adminOnly: false },
  { href: "/insights", label: "Insights", icon: BarChart3, adminOnly: true },
];

const STEP = 48; // item height 44px + 4px gap, used by the sliding indicator

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useCardEffects();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  const u = user;
  const visibleNav = NAV.filter((n) => !n.adminOnly || u.role === "admin");
  const activeIndex = visibleNav.findIndex((n) => pathname.startsWith(n.href));

  const fade = (expanded: boolean) => `transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`;

  const renderSidebar = (expanded: boolean) => (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-indigo-900 to-indigo-950 text-white">
      <SidebarArt className="pointer-events-none absolute bottom-0 left-0 h-[320px] w-64" />

      <Link href="/" className="relative z-10 flex items-center gap-3 px-4 py-6">
        <Logo size={40} className="shrink-0" />
        <div className={`leading-tight ${fade(expanded)}`}>
          <p className="font-heading whitespace-nowrap text-lg font-semibold">Estate CRM</p>
          <p className="whitespace-nowrap text-[11px] uppercase tracking-widest text-indigo-200/70">Sales workspace</p>
        </div>
      </Link>

      <nav className="relative z-10 flex-1 px-3" aria-label="Main">
        <div className="relative">
          <span
            aria-hidden="true"
            className={`absolute inset-x-0 top-0 h-11 rounded-lg border-l-2 border-gold-500 bg-white/15 transition-transform duration-300 ease-out ${
              activeIndex < 0 ? "opacity-0" : ""
            }`}
            style={{ transform: `translateY(${Math.max(activeIndex, 0) * STEP}px)` }}
          />
          <ul className="relative space-y-1">
            {visibleNav.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-label={label}
                    className={`relative flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                      active ? "font-semibold text-white" : "text-indigo-100/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span className={`whitespace-nowrap ${fade(expanded)}`}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      
<div className="relative z-10 border-t border-white/10 p-3">
  <div className="flex items-center gap-3 px-1.5">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-indigo-950">
      {u.name.charAt(0).toUpperCase()}
    </div>

    <div className={`min-w-0 ${fade(expanded)}`}>
      <p className="truncate text-sm font-medium">{u.name}</p>
      <p className="text-xs capitalize text-indigo-200/70">{u.role}</p>
    </div>
  </div>
</div>

    </div>
  );

  return (
    <div className="min-h-screen md:pl-[72px]">
      {/* Desktop sidebar: slim by default, expands over the page when the mouse is on it */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false);
        }}
        className={`fixed inset-y-0 left-0 z-30 hidden overflow-hidden transition-[width,box-shadow] duration-300 ease-out md:block ${
          hovered ? "w-64 shadow-2xl" : "w-[72px]"
        }`}
      >
        {renderSidebar(hovered)}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="overlay-in absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="drawer-in relative h-full w-64 shadow-xl">{renderSidebar(true)}</aside>
        </div>
      )}

      {/* Desktop top bar */}
      <header className="sticky top-0 z-20 hidden h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-8 backdrop-blur md:flex">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex w-full max-w-md items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 transition hover:border-indigo-300 hover:shadow-sm"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search leads, properties, units...</span>
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 text-[11px] text-slate-500">Ctrl K</kbd>
        </button>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 md:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 hover:bg-slate-100">
          <Menu size={20} />
        </button>
        <span className="font-heading text-lg font-semibold">Estate CRM</span>
        <div className="ml-auto flex items-center">
          <button onClick={() => setSearchOpen(true)} aria-label="Search" className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
            <Search size={20} />
          </button>
          <NotificationBell />
        </div>
      </header>

      <main key={pathname} className="page-enter mx-auto max-w-6xl p-4 md:p-8">
        {children}
      </main>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} isAdmin={u.role === "admin"} />
    </div>
  );
}