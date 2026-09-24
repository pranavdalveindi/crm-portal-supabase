"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { useAuth } from "@/src/hooks/useAuth";
import type {
  CallListEntry,
  CallListStatus,
  Priority,
} from "@/src/types";
import HouseholdCard from "@/src/components/call-list/HouseholdCard";

const ITEMS_PER_PAGE = 25;

interface CallListResponse {
  success: boolean;
  count: number;
  callList: CallListEntry[];
}

interface GenerateResponse {
  success: boolean;
  count: number;
  callList: CallListEntry[];
}

interface DistributeResponse {
  success: boolean;
  assigned: number;
  agents: number;
}

export default function CallListPage() {
  const { user, loading: authLoading } = useAuth();

  const [callList, setCallList] = useState<CallListEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [distributing, setDistributing] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<CallListStatus | "ALL">("ALL");

  const [priorityFilter, setPriorityFilter] =
    useState<Priority | "ALL">("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /*
   * Load call list
   */
  async function loadCallList(showRefreshState = false) {
    try {
      setError(null);

      if (showRefreshState) {
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
          : "Failed to load call list"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
   * Initial load
   */
  useEffect(() => {
    if (!authLoading && user) {
      loadCallList();
    }
  }, [authLoading, user]);

  /*
   * Generate call list
   */
  async function handleGenerate() {
    try {
      setGenerating(true);
      setError(null);
      setMessage(null);

      const response =
        await apiFetch<GenerateResponse>(
          "/api/crm/call-list/generate",
          {
            method: "POST",
          }
        );

      setMessage(
        `Call list generated successfully. ${response.count} call(s) found.`
      );

      setCurrentPage(1);

      await loadCallList();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate call list"
      );
    } finally {
      setGenerating(false);
    }
  }

  /*
   * Distribute call list
   */
  async function handleDistribute() {
    try {
      setDistributing(true);
      setError(null);
      setMessage(null);

      const response =
        await apiFetch<DistributeResponse>(
          "/api/crm/call-list/distribute",
          {
            method: "POST",
          }
        );

      setMessage(
        `${response.assigned} call(s) distributed among ${response.agents} agent(s).`
      );

      setCurrentPage(1);

      await loadCallList();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to distribute call list"
      );
    } finally {
      setDistributing(false);
    }
  }

  /*
   * Filter call list
   */
  const filteredCallList = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return callList.filter((entry) => {
      const matchesSearch =
        !searchValue ||
        entry.device_id
          .toLowerCase()
          .includes(searchValue) ||
        entry.hhid
          ?.toLowerCase()
          .includes(searchValue) ||
        entry.rule_name
          ?.toLowerCase()
          .includes(searchValue) ||
        entry.reason
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" ||
        entry.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        entry.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    callList,
    search,
    statusFilter,
    priorityFilter,
  ]);

  /*
   * Reset to first page whenever filters change
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter]);

  /*
   * Statistics
   */
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
    };
  }, [callList]);

  /*
   * Pagination
   */
  const totalPages = Math.ceil(
    filteredCallList.length / ITEMS_PER_PAGE
  );

  /*
   * Protect current page if filtering reduces the number
   * of available pages.
   */
  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /*
   * Current page data
   */
  const paginatedCallList = useMemo(() => {
    const startIndex =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredCallList.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredCallList, currentPage]);

  /*
   * Loading state
   */
  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />

          <p className="text-sm text-slate-500">
            Loading call list...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            CRM Operations
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Call List
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and process households requiring
            follow-up.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Refresh */}

          <button
            type="button"
            onClick={() => loadCallList(true)}
            disabled={refreshing}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {/* Generate */}

          {(user?.role === "developer" ||
            user?.role === "panel_manager") && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating
                ? "Generating..."
                : "Generate Call List"}
            </button>
          )}

          {/* Distribute */}

          {user?.role === "panel_manager" && (
            <button
              type="button"
              onClick={handleDistribute}
              disabled={distributing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {distributing
                ? "Distributing..."
                : "Distribute"}
            </button>
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ===================================================== */}

      {message && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage(null)}
            className="font-medium text-emerald-700 hover:text-emerald-900"
          >
            ×
          </button>
        </div>
      )}

      {/* ===================================================== */}
      {/* ERROR MESSAGE */}
      {/* ===================================================== */}

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

      {/* ===================================================== */}
      {/* STAT CARDS */}
      {/* ===================================================== */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Calls"
          value={stats.total}
          description="Today's call queue"
        />

        <StatCard
          label="Pending"
          value={stats.pending}
          description="Waiting for agent"
        />

        <StatCard
          label="In Progress"
          value={stats.inProgress}
          description="Currently being handled"
        />

        <StatCard
          label="Completed"
          value={stats.completed}
          description="Successfully processed"
        />
      </div>

      {/* ===================================================== */}
      {/* FILTERS */}
      {/* ===================================================== */}

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
              placeholder="Search meter, household or rule..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | CallListStatus
                  | "ALL"
              )
            }
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="COMPLETED">
              Completed
            </option>
          </select>

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
        </div>

        {/* Filter result count */}

        <div className="mt-3 text-xs text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-700">
            {filteredCallList.length === 0
              ? 0
              : (currentPage - 1) *
                  ITEMS_PER_PAGE +
                1}
          </span>{" "}
          -{" "}
          <span className="font-medium text-slate-700">
            {Math.min(
              currentPage * ITEMS_PER_PAGE,
              filteredCallList.length
            )}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-700">
            {filteredCallList.length}
          </span>{" "}
          matching calls
        </div>
      </div>

      {/* ===================================================== */}
      {/* CALL LIST */}
      {/* ===================================================== */}

      {filteredCallList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-6 w-6 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
            </svg>
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No calls found
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            There are no calls matching the current
            filters.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedCallList.map((entry) => (
              <HouseholdCard
                key={entry.id}
                entry={entry}
                onUpdated={() =>
                  loadCallList(true)
                }
              />
            ))}
          </div>

          {/* ================================================= */}
          {/* PAGINATION */}
          {/* ================================================= */}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCallList.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}

/*
 * =========================================================
 * STAT CARD
 * =========================================================
 */

function StatCard({
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

/*
 * =========================================================
 * PAGINATION
 * =========================================================
 */

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const startItem =
    (currentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(
    currentPage * itemsPerPage,
    totalItems
  );

  /*
   * Create compact page numbers.
   *
   * Example:
   *
   * 1 2 3 ... 14 15
   *
   * rather than showing 1-15 when there are many pages.
   */
  const pages = getPageNumbers(
    currentPage,
    totalPages
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      {/* Result count */}

      <p className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-medium text-slate-700">
          {startItem}
        </span>{" "}
        -{" "}
        <span className="font-medium text-slate-700">
          {endItem}
        </span>{" "}
        of{" "}
        <span className="font-medium text-slate-700">
          {totalItems}
        </span>
      </p>

      {/* Controls */}

      <div className="flex items-center gap-1">
        {/* Previous */}

        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() =>
            onPageChange(currentPage - 1)
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {/* Pages */}

        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-sm text-slate-400"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              type="button"
              onClick={() =>
                onPageChange(page)
              }
              className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                currentPage === page
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next */}

        <button
          type="button"
          disabled={
            currentPage === totalPages
          }
          onClick={() =>
            onPageChange(currentPage + 1)
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * PAGE NUMBER GENERATOR
 * =========================================================
 */

function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | "...")[] {
  /*
   * If there are only a few pages,
   * show all of them.
   */

  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  /*
   * Near the beginning
   *
   * 1 2 3 4 5 ... 15
   */

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "...",
      totalPages,
    ];
  }

  /*
   * Near the end
   *
   * 1 ... 11 12 13 14 15
   */

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  /*
   * Middle
   *
   * 1 ... 6 7 8 ... 15
   */

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

