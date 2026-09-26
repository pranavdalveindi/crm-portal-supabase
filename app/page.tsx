import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
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

        <div className="relative z-10">
          {/* Header */}
          <header className="border-b border-slate-200">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
              <Link
                href="/"
                className="flex items-center gap-4"
              >
                {/* Large logo without background */}
                <Image
                  src="/indi-logo.png"
                  alt="Inditronics"
                  width={220}
                  height={100}
                  className="h-auto w-auto max-h-20 max-w-[220px] object-contain"
                  priority
                />

                <div>
                  <div className="font-semibold tracking-tight text-slate-900">
                    Inditronics
                  </div>

                  <div className="text-xs text-slate-500">
                    CRM Portal
                  </div>
                </div>
              </Link>

              {/* Sign in */}
              <Link
                href="/login"
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
          </header>

          {/* Hero */}
          <section className="mx-auto flex min-h-[calc(100vh-82px)] max-w-7xl items-center px-6 py-20 lg:px-8">
            <div className="max-w-4xl">
              {/* Badge */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                Internal CRM system
              </div>

              {/* Heading */}
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                Manage Household
                <span className="block text-slate-500">
                  interactions with clarity.
                </span>
              </h1>

              {/* Description */}
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
                A centralized workspace for monitoring and managing
                CRM rules, distributing call queues, and household
                interactions.
              </p>

              {/* Buttons */}
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Access CRM Portal
                </Link>

                {/* <a
                  href="#workflow"
                  className="rounded-full border border-slate-300 px-7 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Explore workflow
                </a> */}
              </div>

              {/* Workflow */}
              <div
                id="workflow"
                className="mt-16 flex flex-wrap gap-x-10 gap-y-4 border-t border-slate-200 pt-6 text-sm text-slate-500"
              >
                <div>
                  <span className="font-medium text-slate-800">
                    CRM Rules
                  </span>

                  <span className="ml-2">
                    Automated conditions
                  </span>
                </div>

                <div>
                  <span className="font-medium text-slate-800">
                    Call Queue
                  </span>

                  <span className="ml-2">
                    Agent distribution
                  </span>
                </div>

                <div>
                  <span className="font-medium text-slate-800">
                    Households
                  </span>

                  <span className="ml-2">
                    Interaction tracking
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}