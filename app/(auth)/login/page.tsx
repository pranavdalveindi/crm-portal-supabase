"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { login } from "@/src/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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
    <main className="min-h-screen bg-white text-slate-900">
      <div className="relative min-h-screen overflow-hidden">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[750px] w-[750px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.04] blur-3xl" />

          <div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.04] blur-3xl" />

          <div className="absolute -bottom-48 -left-48 h-[600px] w-[600px] rounded-full bg-cyan-500/[0.03] blur-3xl" />

          <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/70" />

          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/50" />

          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/40" />
        </div>

        <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
          {/* Left side - Desktop */}
          <section className="hidden border-r border-slate-200 lg:flex lg:flex-col lg:justify-between lg:p-12">
            {/* Desktop logo */}
            <Link
              href="/"
              className="inline-flex items-center"
            >
              <Image
                src="/indi-logo.png"
                alt="Inditronics"
                width={260}
                height={120}
                className="h-auto w-auto max-h-24 max-w-[260px] object-contain"
                priority
              />
            </Link>

            {/* Desktop heading */}
            <div className="max-w-md">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 xl:text-5xl">
                Inditronics CRM Portal
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Manage Household follow-ups.
              </p>
            </div>

            {/* Footer */}
            <div className="text-xs text-slate-400">
              Inditronics
            </div>
          </section>

          {/* Right side - Login */}
          <section className="flex min-h-screen items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
              {/* Mobile logo */}
              <div className="mb-12 lg:hidden">
                <Link
                  href="/"
                  className="inline-flex items-center"
                >
                  <Image
                    src="/indi-logo.png"
                    alt="Inditronics"
                    width={220}
                    height={100}
                    className="h-auto w-auto max-h-20 max-w-[220px] object-contain"
                    priority
                  />
                </Link>
              </div>

              {/* Heading */}
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Sign in
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Access your CRM account.
                </p>
              </div>

              {/* Login form */}
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
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
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="name@inditronics.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700"
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
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign in"}
                </button>
              </form>

              {/* Back to home */}
              <div className="mt-8">
                <Link
                  href="/"
                  className="text-sm text-slate-500 transition hover:text-slate-900"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}