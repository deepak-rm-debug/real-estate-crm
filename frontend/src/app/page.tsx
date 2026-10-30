
"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  History,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

import { CursorSparkle } from "@/components/effects/CursorSparkle";
import { useAuth } from "@/lib/auth";

const FEATURES = [
  { icon: Users, title: "Lead pipeline", text: "Track every enquiry across 7 stages, from New to Booked, with notes and follow-up dates." },
  { icon: Building2, title: "Property inventory", text: "Projects, buildings and units with price, type and live availability." },
  { icon: ShieldCheck, title: "Double-booking proof", text: "A row lock plus a database constraint guarantee a unit is booked only once." },
  { icon: CalendarClock, title: "Follow-up radar", text: "Overdue and today's follow-ups surface on the dashboard so no lead goes cold." },
  { icon: History, title: "Activity timeline", text: "Every stage change, note, assignment and booking is logged per lead." },
  { icon: LayoutDashboard, title: "Role-based access", text: "Admins see the whole team. Sales employees see only their own leads." },
];

const STEPS = [
  { n: "01", title: "Capture the lead", text: "Add enquiries from any source and assign them to a sales employee." },
  { n: "02", title: "Nurture and visit", text: "Log notes, schedule follow-ups and move the lead through the pipeline." },
  { n: "03", title: "Book the unit", text: "Pick an available unit. It is locked instantly so nobody else can take it." },
];

const STATS = [
  { value: "7", label: "Pipeline stages" },
  { value: "1", label: "Active booking per unit" },
  { value: "2", label: "Roles with permissions" },
  { value: "Live", label: "Availability and dashboard" },
];

function PreviewCard() {
  const bars = [78, 62, 48, 34, 20];
  return (
    <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Sample preview</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Leads", "128"],
          ["Bookings", "24"],
          ["Available", "63"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2.5">
        {bars.map((w, i) => (
          <div key={i} className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-6 gap-1.5">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className={`h-6 rounded ${i % 5 === 0 ? "bg-slate-300" : i % 7 === 0 ? "bg-amber-300" : "bg-emerald-300"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Skyline() {
  return (
    <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-24 w-full text-white/5" aria-hidden="true">
      <g fill="currentColor">
        <rect x="20" y="60" width="70" height="80" />
        <rect x="110" y="30" width="60" height="110" />
        <rect x="190" y="75" width="80" height="65" />
        <rect x="290" y="15" width="70" height="125" />
        <rect x="380" y="55" width="90" height="85" />
        <rect x="490" y="40" width="60" height="100" />
        <rect x="570" y="80" width="80" height="60" />
        <rect x="670" y="20" width="75" height="120" />
        <rect x="765" y="65" width="70" height="75" />
        <rect x="855" y="35" width="85" height="105" />
        <rect x="960" y="70" width="60" height="70" />
        <rect x="1040" y="25" width="70" height="115" />
        <rect x="1130" y="60" width="60" height="80" />
      </g>
    </svg>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Open dashboard" : "Sign in";

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-900 to-indigo-950 text-white">
        <Skyline />
        <CursorSparkle />
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-indigo-950">
              <Building2 size={20} />
            </span>
            <span className="font-heading text-xl font-semibold">Estate CRM</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-indigo-100/80 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#roles" className="hover:text-white">Roles</a>
          </nav>
          <Link
            href={ctaHref}
            className={`rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-900 transition hover:bg-indigo-50 ${loading ? "opacity-0" : ""}`}
          >
            {ctaLabel}
          </Link>
        </header>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-28 pt-14 lg:grid-cols-2 lg:pb-36 lg:pt-20">
          <div>
            <span className="inline-block rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-gold-400">
              CRM for real estate sales teams
            </span>
            <h1 className="font-heading mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
              Sell more homes.
              <br />
              <span className="text-gold-400">Never double-book a unit.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-indigo-100/80">
              Manage leads, track follow-ups and book units from one clean workspace, built for builders and
              their sales teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 font-medium text-indigo-950 transition hover:bg-gold-400"
              >
                {user ? "Open dashboard" : "Try the live demo"} <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-lg border border-white/25 px-6 py-3 font-medium text-white transition hover:bg-white/10"
              >
                See features
              </a>
            </div>
            
          </div>

          <div className="lg:pl-6">
            <PreviewCard />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-100">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-3xl font-semibold text-indigo-700">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold">Everything your sales team needs</h2>
          <p className="mt-3 text-slate-600">From the first enquiry to the signed booking, in one place.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon size={22} />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-heading text-center text-3xl font-semibold">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-white p-6 shadow-sm">
                <span className="font-heading text-4xl font-semibold text-gold-500">{s.n}</span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-heading text-center text-3xl font-semibold">Built for two kinds of users</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-indigo-900 p-8 text-white">
            <h3 className="font-heading text-2xl font-semibold">Admin</h3>
            <p className="mt-1 text-sm text-indigo-200/80">The sales manager</p>
            <ul className="mt-5 space-y-2.5 text-sm text-indigo-50">
              <li>See and manage every lead in the team</li>
              <li>Assign and reassign leads to sales employees</li>
              <li>Add projects, buildings and units</li>
              <li>Team-wide dashboard and bookings</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h3 className="font-heading text-2xl font-semibold">Sales employee</h3>
            <p className="mt-1 text-sm text-slate-500">The person on the ground</p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
              <li>Work only on the leads assigned to them</li>
              <li>Log notes, follow-ups and stage changes</li>
              <li>Book available units for their leads</li>
              <li>A personal dashboard of their own pipeline</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-5 mb-16 max-w-6xl rounded-3xl bg-gradient-to-r from-indigo-800 to-indigo-950 px-6 py-14 text-center text-white lg:mx-auto">
        <h2 className="font-heading text-3xl font-semibold">See it in action</h2>
        <p className="mx-auto mt-3 max-w-lg text-indigo-100/80">Sign in to explore leads, properties and bookings.</p>
        <Link
          href={ctaHref}
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 font-medium text-indigo-950 transition hover:bg-gold-400"
        >
          {user ? "Open dashboard" : "Try the live demo"} <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500">
        Estate CRM · Built with Next.js, FastAPI and PostgreSQL
      </footer>
    </div>
  );
}