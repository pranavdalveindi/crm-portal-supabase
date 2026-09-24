"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/src/lib/api";

interface AgentKPI {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  totalCalls: number;
  callsToday: number;
  connected: number;
  noAnswer: number;
  callback: number;
  escalated: number;
}

interface DailyAgentCalls {
  date: string;
  agents: Record<string, number>;
}

interface KPIResponse {
  success: boolean;

  summary: {
    totalCalls: number;
    callsToday: number;
    connected: number;
    noAnswer: number;
    callback: number;
    escalated: number;
  };

  agents: AgentKPI[];

  dailyAgentCalls: DailyAgentCalls[];
}

interface ChartRow {
  date: string;
  [key: string]: string | number;
}

export default function KPIPage() {
  const [data, setData] =
    useState<KPIResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadKPI() {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiFetch<KPIResponse>(
          "/api/crm/kpi"
        );

      setData(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load KPI data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKPI();
  }, []);

  /*
   * =========================================================
   * PREPARE GRAPH DATA
   * =========================================================
   */

  const chartData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.dailyAgentCalls.map(
      (day) => {
        const row: ChartRow = {
          date: formatGraphDate(
            day.date
          ),
        };

        for (const agent of data.agents) {
          row[agent.id] =
            day.agents[agent.id] ?? 0;
        }

        return row;
      }
    );
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />

          <p className="text-sm text-slate-500">
            Loading KPI data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={loadKPI}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Performance
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Call Agent KPIs
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor call activity and outcomes across
            your call agents.
          </p>
        </div>

        <button
          type="button"
          onClick={loadKPI}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {/* ===================================================== */}
      {/* SUMMARY */}
      {/* ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KPIStat
          label="Total Calls"
          value={
            data.summary.totalCalls
          }
        />

        <KPIStat
          label="Today"
          value={
            data.summary.callsToday
          }
        />

        <KPIStat
          label="Connected"
          value={
            data.summary.connected
          }
        />

        <KPIStat
          label="No Answer"
          value={
            data.summary.noAnswer
          }
        />

        <KPIStat
          label="Callback"
          value={
            data.summary.callback
          }
        />

        <KPIStat
          label="Escalated"
          value={
            data.summary.escalated
          }
        />
      </div>

      {/* ===================================================== */}
      {/* DAILY CALL GRAPH */}
      {/* ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Daily Call Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Number of calls made by each call agent over
            the last 30 days.
          </p>
        </div>

        <div className="p-6">
          {chartData.length === 0 ||
          data.agents.length === 0 ? (
            <div className="flex h-[350px] items-center justify-center">
              <p className="text-sm text-slate-500">
                No call activity available.
              </p>
            </div>
          ) : (
            <div className="h-[380px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 12,
                    }}
                    tickMargin={10}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 12,
                    }}
                    width={40}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border:
                        "1px solid #e2e8f0",
                      boxShadow:
                        "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    labelStyle={{
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  />

                  <Legend />

                  {data.agents.map(
                    (agent) => (
                      <Line
                        key={agent.id}
                        type="monotone"
                        dataKey={agent.id}
                        name={agent.name}
                        strokeWidth={2}
                        dot={{
                          r: 3,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    )
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* AGENT PERFORMANCE */}
      {/* ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Agent Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Number of calls recorded by each call agent.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Agent
                </th>

                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Today
                </th>

                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total
                </th>

                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Connected
                </th>

                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  No Answer
                </th>

                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Callback
                </th>

                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Escalated
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {data.agents.map(
                (agent) => (
                  <tr
                    key={agent.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {agent.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {agent.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-semibold text-slate-900">
                        {agent.callsToday}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-semibold text-slate-900">
                        {agent.totalCalls}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center text-sm text-slate-600">
                      {agent.connected}
                    </td>

                    <td className="px-4 py-4 text-center text-sm text-slate-600">
                      {agent.noAnswer}
                    </td>

                    <td className="px-4 py-4 text-center text-sm text-slate-600">
                      {agent.callback}
                    </td>

                    <td className="px-4 py-4 text-center text-sm text-slate-600">
                      {agent.escalated}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          agent.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {agent.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {data.agents.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-500">
              No call agents found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * FORMAT GRAPH DATE
 * =========================================================
 */

function formatGraphDate(
  dateString: string
) {
  const date = new Date(
    `${dateString}T00:00:00+05:30`
  );

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  ).format(date);
}

/*
 * =========================================================
 * KPI STAT
 * =========================================================
 */

function KPIStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

