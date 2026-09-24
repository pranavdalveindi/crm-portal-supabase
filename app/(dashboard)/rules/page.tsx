"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import type { Priority, Rule } from "@/src/types";

interface RulesResponse {
  success: boolean;
  count: number;
  rules: Rule[];
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [priorityFilter, setPriorityFilter] =
    useState<Priority | "ALL">("ALL");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [error, setError] = useState<string | null>(
    null
  );

  async function loadRules(showRefreshState = false) {
    try {
      setError(null);

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiFetch<RulesResponse>(
        "/api/crm/rules"
      );

      setRules(response.rules ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load anomaly rules"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  const filteredRules = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return rules.filter((rule) => {
      const matchesSearch =
        !searchValue ||
        rule.name
          .toLowerCase()
          .includes(searchValue) ||
        rule.description
          ?.toLowerCase()
          .includes(searchValue) ||
        String(
          rule.event_type ?? rule.eventType ?? ""
        ).includes(searchValue);

      const priority = rule.priority;

      const isActive =
        rule.is_active ?? rule.isActive ?? false;

      const matchesPriority =
        priorityFilter === "ALL" ||
        priority === priorityFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isActive) ||
        (statusFilter === "INACTIVE" && !isActive);

      return (
        matchesSearch &&
        matchesPriority &&
        matchesStatus
      );
    });
  }, [
    rules,
    search,
    priorityFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: rules.length,

      active: rules.filter(
        (rule) =>
          rule.is_active ??
          rule.isActive ??
          false
      ).length,

      inactive: rules.filter(
        (rule) =>
          !(
            rule.is_active ??
            rule.isActive ??
            false
          )
      ).length,

      highPriority: rules.filter(
        (rule) => rule.priority === "HIGH"
      ).length,
    };
  }, [rules]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />

          <p className="text-sm text-slate-500">
            Loading anomaly rules...
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
            CRM Configuration
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Anomaly Rules
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Configure and monitor the rules that
            determine which households enter the
            call queue.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadRules(true)}
          disabled={refreshing}
          className="self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="font-medium text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* STATS */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <RuleStatCard
          label="Total Rules"
          value={stats.total}
          description="Configured rules"
        />

        <RuleStatCard
          label="Active"
          value={stats.active}
          description="Currently evaluating"
        />

        <RuleStatCard
          label="Inactive"
          value={stats.inactive}
          description="Currently disabled"
        />

        <RuleStatCard
          label="High Priority"
          value={stats.highPriority}
          description="High-priority rules"
        />
      </div>

      {/* ================================================= */}
      {/* FILTERS */}
      {/* ================================================= */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          {/* Search */}

          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
              />

              <path d="m21 21-4.3-4.3" />
            </svg>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search rules..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Priority */}

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value as
                  | Priority
                  | "ALL"
              )
            }
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">
              All priorities
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="LOW">
              Low
            </option>
          </select>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | "ACTIVE"
                  | "INACTIVE"
              )
            }
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-700">
            {filteredRules.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-700">
            {rules.length}
          </span>{" "}
          rules
        </div>
      </div>

      {/* ================================================= */}
      {/* RULE LIST */}
      {/* ================================================= */}

      {filteredRules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-6 w-6 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 3 4 6v5c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V6l-8-3Z" />

              <path d="M9 12h6" />
            </svg>
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No rules found
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            No anomaly rules match the current
            filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ========================================================= */
/* RULE CARD                                                  */
/* ========================================================= */

function RuleCard({
  rule,
}: {
  rule: Rule;
}) {
  const isActive =
    rule.is_active ??
    rule.isActive ??
    false;

  const eventType =
    rule.event_type ??
    rule.eventType ??
    null;

  const lookbackDays =
    rule.lookback_days ??
    rule.lookbackDays ??
    0;

  const condition =
    rule.condition ?? {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
      {/* Top */}

      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                {rule.name}
              </h2>

              <StatusBadge active={isActive} />

              <PriorityBadge
                priority={rule.priority}
              />
            </div>

            {rule.description && (
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                {rule.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Details */}

      <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
        <RuleDetail
          label="Event Type"
          value={
            eventType !== null
              ? `Type ${eventType}`
              : "—"
          }
        />

        <RuleDetail
          label="Lookback"
          value={`${lookbackDays} day${
            lookbackDays === 1 ? "" : "s"
          }`}
        />

        <RuleDetail
          label="Priority"
          value={rule.priority}
        />

        <RuleDetail
          label="Condition"
          value={formatCondition(condition)}
        />
      </div>

      {/* Footer */}

      <div className="flex flex-col gap-2 px-5 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Rule ID:{" "}
          <span className="font-mono text-slate-500">
            {rule.id}
          </span>
        </span>

        {rule.createdAt && (
          <span>
            Created{" "}
            {formatDate(rule.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ========================================================= */
/* RULE DETAIL                                                */
/* ========================================================= */

function RuleDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ========================================================= */
/* STAT CARD                                                  */
/* ========================================================= */

function RuleStatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
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
/* BADGES                                                     */
/* ========================================================= */

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: Priority;
}) {
  const styles = {
    HIGH: "bg-red-50 text-red-700",
    MEDIUM: "bg-amber-50 text-amber-700",
    LOW: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        styles[priority]
      }`}
    >
      {priority}
    </span>
  );
}

/* ========================================================= */
/* HELPERS                                                    */
/* ========================================================= */

function formatCondition(
  condition: Record<string, unknown>
) {
  if (!condition || Object.keys(condition).length === 0) {
    return "No condition";
  }

  if (
    typeof condition.min_days === "number"
  ) {
    return `${condition.min_days} consecutive day${
      condition.min_days === 1 ? "" : "s"
    }`;
  }

  if (
    typeof condition.mode === "string" &&
    typeof condition.min_days === "number"
  ) {
    return `${condition.mode} — ${condition.min_days} day${
      condition.min_days === 1 ? "" : "s"
    }`;
  }

  if (typeof condition.mode === "string") {
    return condition.mode;
  }

  return Object.entries(condition)
    .map(([key, value]) => {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return `${key}: ${value}`;
      }

      return `${key}: configured`;
    })
    .join(" • ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
