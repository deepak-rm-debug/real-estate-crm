"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { SkylineArt } from "@/components/ui/SkylineArt";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired")) {
      setError("Your session expired. Please login again.");
    }
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-900 to-indigo-950 px-4 py-10">
      <SkylineArt className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-white/5" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <Logo size={64} />
          <h1 className="font-heading mt-4 text-3xl font-semibold">Estate CRM</h1>
          <p className="mt-1 text-sm text-indigo-200/80">Sales workspace for real estate teams</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="text-lg font-semibold">Welcome back</h2>
          <p className="mb-5 text-sm text-slate-500">Sign in to continue</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${field} pr-11`}
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}