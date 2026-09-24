"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";
import type { CallListEntry } from "@/src/types";

interface CallListResponse {
  success: boolean;
  count: number;
  callList: CallListEntry[];
}

export default function DashboardPage() {
  const [callList, setCallList] = useState<CallListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard(showRefresh = false) {
    try {
      setError(null);

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiFetch<CallListResponse>(
        "/api/crm/call-list"
      );

      setCallList(response.callList ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    return {
      total: callList.length,

      pending: callList.filter(
        (item) => item.status === "PENDING"
      ).length,

      inProgress: callList.filter(
        (item) => item.status === "IN_PROGRESS"
      ).length,

      completed: callList.filter(
        (item) => item.status === "COMPLETED"
      ).length,

      highPriority: callList.filter(
        (item) => item.priority === "HIGH"
      ).length,

      unassigned: callList.filter(
        (item) => !item.assigned_to
      ).length,
    };
  }, [callList]);

  const completionRate =
    stats.total > 0
      ? Math.round(
          (stats.completed / stats.total) * 100
        )
      : 0;

  const recentCalls = useMemo(() => {
    return [...callList]
      .sort((a, b) => {
        const aTime = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const bTime = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return bTime - aTime;
      })
      .slice(0, 8);
  }, [callList]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />

          <p className="text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Panel Manager
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor today's CRM call queue and agent
            workload.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="font-medium hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* PRIMARY STATS */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <DashboardStat
          label="Total Calls"
          value={stats.total}
          description="Generated today"
          icon="queue"
        />

        <DashboardStat
          label="Pending"
          value={stats.pending}
          description="Waiting to be handled"
          icon="pending"
        />

        <DashboardStat
          label="In Progress"
          value={stats.inProgress}
          description="Currently being handled"
          icon="progress"
        />

        <DashboardStat
          label="Completed"
          value={stats.completed}
          description="Successfully processed"
          icon="completed"
        />
      </div>

      {/* ================================================= */}
      {/* SECONDARY STATS */}
      {/* ================================================= */}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="High Priority"
          value={stats.highPriority}
          description="Calls requiring attention"
        />

        <MetricCard
          label="Unassigned"
          value={stats.unassigned}
          description="Calls not assigned to an agent"
        />

        <MetricCard
          label="Completion Rate"
          value={`${completionRate}%`}
          description="Completed calls today"
        />
      </div>

      {/* ================================================= */}
      {/* QUICK ACTIONS */}
      {/* ================================================= */}

      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction
          href="/call-list"
          title="View Call List"
          description="Review and manage today's call queue."
          icon="phone"
        />

        <QuickAction
          href="/rules"
          title="Anomaly Rules"
          description="Review the rules generating call requests."
          icon="rules"
        />

        <QuickAction
          href="/call-list"
          title="Distribute Calls"
          description="Assign pending calls to available agents."
          icon="users"
        />
      </div>

      {/* ================================================= */}
      {/* RECENT CALLS */}
      {/* ================================================= */}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Recent Call Queue
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Latest generated call-list entries
            </p>
          </div>

          <Link
            href="/call-list"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {recentCalls.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No calls generated today
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Generate the call list to populate the queue.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentCalls.map((call) => (
              <RecentCallRow
                key={call.id}
                call={call}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* FOOTER INFO */}
      {/* ================================================= */}

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <svg
              className="h-4 w-4 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5" />
              <path d="M12 8h.01" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-semibold text-blue-900">
              Call queue management
            </p>

            <p className="mt-1 text-sm text-blue-700">
              Use the Call List to generate and distribute
              today's calls. Agents will only see calls
              assigned to them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* DASHBOARD STAT                                             */
/* ========================================================= */

function DashboardStat({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: "queue" | "pending" | "progress" | "completed";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <StatIcon type={icon} />
      </div>
    </div>
  );
}

/* ========================================================= */
/* METRIC CARD                                                */
/* ========================================================= */

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ========================================================= */
/* QUICK ACTION                                               */
/* ========================================================= */

function QuickAction({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: "phone" | "rules" | "users";
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-slate-200">
          <QuickActionIcon type={icon} />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <svg
          className="ml-auto mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}

/* ========================================================= */
/* RECENT CALL ROW                                           */
/* ========================================================= */

function RecentCallRow({
  call,
}: {
  call: CallListEntry;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-slate-900">
            {call.device_id}
          </span>

          {call.hhid && (
            <span className="text-xs text-slate-500">
              {call.hhid}
            </span>
          )}

          <PriorityBadge
            priority={call.priority}
          />
        </div>

        <p className="mt-1 truncate text-xs text-slate-500">
          {call.rule_name ?? "Anomaly rule"}
          {call.reason
            ? ` • ${call.reason}`
            : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {call.days_affected !== null &&
          call.days_affected !== undefined && (
            <span className="hidden text-xs text-slate-400 md:block">
              {call.days_affected} day
              {call.days_affected === 1
                ? ""
                : "s"}
            </span>
          )}

        <StatusBadge status={call.status} />
      </div>
    </div>
  );
}

/* ========================================================= */
/* STATUS BADGE                                               */
/* ========================================================= */

function StatusBadge({
  status,
}: {
  status: CallListEntry["status"];
}) {
  const styles = {
    PENDING: "bg-amber-50 text-amber-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
  };

  const labels = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

/* ========================================================= */
/* PRIORITY BADGE                                             */
/* ========================================================= */

function PriorityBadge({
  priority,
}: {
  priority: CallListEntry["priority"];
}) {
  const styles = {
    HIGH: "bg-red-50 text-red-700",
    MEDIUM: "bg-amber-50 text-amber-700",
    LOW: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

/* ========================================================= */
/* STAT ICON                                                  */
/* ========================================================= */

function StatIcon({
  type,
}: {
  type:
    | "queue"
    | "pending"
    | "progress"
    | "completed";
}) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      {type === "queue" && (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h10" />
        </svg>
      )}

      {type === "pending" && (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3 2" />
        </svg>
      )}

      {type === "progress" && (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8 12h8" />
        </svg>
      )}

      {type === "completed" && (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      )}
    </div>
  );
}

/* ========================================================= */
/* QUICK ACTION ICON                                         */
/* ========================================================= */

function QuickActionIcon({
  type,
}: {
  type: "phone" | "rules" | "users";
}) {
  if (type === "phone") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 2 2.4Z" />
      </svg>
    );
  }

  if (type === "rules") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 3 4 6v5c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V6l-8-3Z" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15 14.5c3.1-.2 5.5 2.1 5.5 5.5" />
    </svg>
  );
}