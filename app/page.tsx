import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950">
              IT
            </div>

            <div>
              <div className="font-semibold tracking-tight">Inditronics</div>
              <div className="text-xs text-slate-400">CRM Portal</div>
            </div>
          </div>

          <Link
            href="/login"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-20 lg:px-8 lg:pb-28 lg:pt-28">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            CRM systems operational
          </div>

          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Manage customer
            <span className="block text-slate-400">
              interactions with clarity.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
            A centralized workspace for monitoring meter activity, managing
            CRM rules, distributing call queues, and recording customer
            interactions.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Access CRM Portal
            </Link>

            <a
              href="#workflow"
              className="rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore workflow
            </a>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        className="border-t border-white/10 bg-slate-900/50"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-12">
            <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
              CRM workflow
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              From device events to customer calls.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                title: "Events",
                description:
                  "Meter activity is collected and evaluated against configured CRM conditions.",
              },
              {
                number: "02",
                title: "Rules",
                description:
                  "Configurable rules identify households requiring customer follow-up.",
              },
              {
                number: "03",
                title: "Call Queue",
                description:
                  "Qualifying households are added to the daily CRM call list and distributed to agents.",
              },
              {
                number: "04",
                title: "Call Logs",
                description:
                  "Agents record outcomes, issue tags, and notes after contacting customers.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="text-sm font-medium text-slate-500">
                  {item.number}
                </div>

                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-sm text-slate-500 lg:px-8">
          <span>Inditronics CRM Portal</span>
          <span>Internal system</span>
        </div>
      </footer>
    </main>
  );
}

