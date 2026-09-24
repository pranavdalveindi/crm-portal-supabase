"use client";

import { useState } from "react";
import { apiFetch } from "@/src/lib/api";
import type {
  CallListEntry,
  CallOutcome,
} from "@/src/types";

interface HouseholdCardProps {
  entry: CallListEntry;
  onUpdated?: () => void;
}

const outcomes: {
  value: CallOutcome;
  label: string;
}[] = [
  {
    value: "CONNECTED",
    label: "Connected",
  },
  {
    value: "NO_ANSWER",
    label: "No Answer",
  },
  {
    value: "CALLBACK",
    label: "Callback Required",
  },
  {
    value: "ESCALATED",
    label: "Escalated",
  },
];

const issueTags = [
  "Black Screen",
  "Meter Rejected",
  "WiFi Subscription Ended",
  "No Viewership",
  "Field Visit Required",
  "Other",
];

export default function HouseholdCard({
  entry,
  onUpdated,
}: HouseholdCardProps) {
  const [showForm, setShowForm] = useState(false);

  const [outcome, setOutcome] =
    useState<CallOutcome | "">("");

  const [selectedTags, setSelectedTags] =
    useState<string[]>([]);

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }

  async function handleSubmit() {
    if (!outcome) {
      setError("Please select a call outcome.");
      return;
    }

    if (
      selectedTags.includes("Other") &&
      !notes.trim()
    ) {
      setError(
        "Please enter a remark when selecting Other."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiFetch("/api/crm/call-logs", {
        method: "POST",
        body: JSON.stringify({
          call_list_id: entry.id,
          device_id: entry.device_id,
          household_id: entry.household_id,
          called_at: new Date().toISOString(),
          outcome,
          issue_tags:
            selectedTags.length > 0
              ? selectedTags
              : null,
          notes: notes.trim() || null,
        }),
      });

      setShowForm(false);
      setOutcome("");
      setSelectedTags([]);
      setNotes("");

      onUpdated?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save call log."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Main information */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-950">
                {entry.device_id}
              </span>

              <StatusBadge status={entry.status} />

              <PriorityBadge priority={entry.priority} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <InfoItem
                label="Household"
                value={entry.hhid || "—"}
              />

              <InfoItem
                label="Rule"
                value={entry.rule_name || "—"}
              />

              <InfoItem
                label="Days affected"
                value={
                  entry.days_affected != null
                    ? `${entry.days_affected} day(s)`
                    : "—"
                }
              />
            </div>

            {entry.reason && (
              <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Reason
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {entry.reason}
                </p>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="shrink-0">
            {entry.status !== "COMPLETED" ? (
              <button
                type="button"
                onClick={() => {
                  setShowForm((current) => !current);
                  setError("");
                }}
                className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 lg:w-auto"
              >
                {showForm
                  ? "Cancel"
                  : "Log Call"}
              </button>
            ) : (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
                Call completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call form */}
      {showForm && entry.status !== "COMPLETED" && (
        <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
          <div className="max-w-3xl">
            <h3 className="text-base font-semibold text-slate-950">
              Record call outcome
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Record what happened during the customer call.
            </p>

            {/* Outcome */}
            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700">
                Call outcome
              </label>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {outcomes.map((item) => {
                  const selected =
                    outcome === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setOutcome(item.value)
                      }
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                        selected
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Issue tags */}
            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700">
                Issue tags
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {issueTags.map((tag) => {
                  const selected =
                    selectedTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                        selected
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label
                htmlFor={`notes-${entry.id}`}
                className="text-sm font-medium text-slate-700"
              >
                {selectedTags.includes("Other")
                  ? "Other remark"
                  : "Notes"}
              </label>

              <textarea
                id={`notes-${entry.id}`}
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={4}
                placeholder={
                  selectedTags.includes("Other")
                    ? "Describe the issue..."
                    : "Add any relevant notes..."
                }
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Call Log"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: CallListEntry["status"];
}) {
  const styles = {
    PENDING:
      "bg-amber-50 text-amber-700 border-amber-200",
    IN_PROGRESS:
      "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status]
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: CallListEntry["priority"];
}) {
  const styles = {
    HIGH: "text-red-600",
    MEDIUM: "text-amber-600",
    LOW: "text-slate-500",
  };

  return (
    <span
      className={`text-xs font-semibold ${
        styles[priority]
      }`}
    >
      {priority}
    </span>
  );
}
