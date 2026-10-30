"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Search,
  Users,
} from "lucide-react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/leads", label: "Leads", icon: Users, adminOnly: false },
  { href: "/properties", label: "Properties", icon: Building2, adminOnly: false },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck, adminOnly: false },
  { href: "/insights", label: "Insights", icon: BarChart3, adminOnly: true },
];

const STEP = 48; // item height 44px + 4px gap, used by the sliding indicator
const STORAGE_KEY = "crm_sidebar_collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

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

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  }

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

  const renderSidebar = (c: boolean) => (
    <div className="flex h-full flex-col bg-indigo-900 text-white">
      <Link href="/" className={`flex items-center gap-3 py-6 ${c ? "justify-center" : "px-5"}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-indigo-950">
          <Building2 size={20} />
        </div>
        {!c && (
          <div className="leading-tight">
            <p className="font-heading text-lg font-semibold">Estate CRM</p>
            <p className="text-[11px] uppercase tracking-widest text-indigo-200/70">Sales workspace</p>
          </div>
        )}
      </Link>

      <nav className="flex-1 px-3" aria-label="Main">
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
                    data-tip={c ? label : undefined}
                    data-tip-side="right"
                    className={`relative flex h-11 items-center rounded-lg text-sm font-medium transition-colors ${
                      c ? "justify-center" : "gap-3 px-3.5"
                    } ${active ? "font-semibold text-white" : "text-indigo-100/70 hover:bg-white/5 hover:text-white"}`}
                  >
                    <Icon size={20} className="shrink-0" />
                    {!c && <span className="whitespace-nowrap">{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        {c ? (
          <button
            onClick={logout}
            aria-label="Logout"
            data-tip="Logout"
            data-tip-side="right"
            className="flex w-full items-center justify-center rounded-lg border border-white/20 py-2 text-white transition hover:bg-white/10"
          >
            <LogOut size={16} />
          </button>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-indigo-950">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="text-xs capitalize text-indigo-200/70">{u.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition hover:bg-white/10"
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-[padding] duration-300 ${collapsed ? "md:pl-[72px]" : "md:pl-64"}`}>
      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-300 md:block ${collapsed ? "w-[72px]" : "w-64"}`}>
        {renderSidebar(collapsed)}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow transition hover:text-indigo-700"
        >
          {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="overlay-in absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="drawer-in relative h-full w-64 shadow-xl">{renderSidebar(false)}</aside>
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