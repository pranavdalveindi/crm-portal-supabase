"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/src/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);

      router.push("/call-list");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid credentials. Please check your email and password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left side */}
        <section className="hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950">
                IT
              </div>

              <div>
                <div className="font-semibold tracking-tight">
                  Inditronics
                </div>
                <div className="text-xs text-slate-400">
                  CRM Portal
                </div>
              </div>
            </Link>
          </div>

          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
              Internal CRM
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight xl:text-5xl">
              Manage customer operations from one workspace.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
              Monitor CRM rules, manage call queues, distribute customer
              follow-ups, and record call outcomes.
            </p>
          </div>

          <div className="text-sm text-slate-600">
            Internal system · Inditronics
          </div>
        </section>

        {/* Right side */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950">
                  IT
                </div>

                <div>
                  <div className="font-semibold tracking-tight">
                    Inditronics
                  </div>
                  <div className="text-xs text-slate-400">
                    CRM Portal
                  </div>
                </div>
              </Link>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Sign in to CRM
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Use your Inditronics account to access the CRM portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@inditronics.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/30 focus:bg-white/[0.06]"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/30 focus:bg-white/[0.06]"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6">
              <Link
                href="/"
                className="text-sm text-slate-500 transition hover:text-slate-300"
              >
                ← Back to home
              </Link>
            </div>

            <p className="mt-8 text-center text-xs leading-5 text-slate-600">
              Access is restricted to authorized Inditronics accounts.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
