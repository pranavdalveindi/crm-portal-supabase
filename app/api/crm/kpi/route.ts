import { NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabase/server";
import { getCurrentCRMUser } from "@/src/services/crm/auth-service";

export async function GET() {
  try {
    const currentUser = await getCurrentCRMUser();

    if (currentUser.role !== "panel_manager") {
      return NextResponse.json(
        {
          success: false,
          error: "Only panel managers can view KPIs",
        },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    /*
     * =========================================================
     * GET CALL LOGS
     * =========================================================
     */

    const { data: logs, error: logsError } =
      await supabase
        .from("crm_call_logs")
        .select(`
          id,
          agent_id,
          outcome,
          called_at,
          createdAt
        `);

    if (logsError) {
      console.error("KPI logs error:", logsError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load KPI data",
        },
        { status: 500 }
      );
    }

    /*
     * =========================================================
     * GET CALL AGENTS
     * =========================================================
     */

    const { data: agents, error: agentsError } =
      await supabase
        .from("crm_users")
        .select(`
          id,
          name,
          email,
          role,
          "isActive"
        `)
        .eq("role", "call_agent");

    if (agentsError) {
      console.error(
        "KPI agents error:",
        agentsError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load call agents",
        },
        { status: 500 }
      );
    }

    const allLogs = logs ?? [];
    const allAgents = agents ?? [];

    /*
     * =========================================================
     * DATE HELPER
     *
     * Convert timestamp to India date.
     *
     * Example:
     * 2026-09-23T20:00:00Z
     *
     * becomes:
     * 2026-09-24
     * =========================================================
     */

    function getIndiaDate(
      timestamp: string | null
    ): string | null {
      if (!timestamp) {
        return null;
      }

      try {
        return new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        ).format(new Date(timestamp));
      } catch {
        return null;
      }
    }

    /*
     * =========================================================
     * TODAY
     * =========================================================
     */

    const today = getIndiaDate(
      new Date().toISOString()
    );

    const todayLogs = allLogs.filter((log) => {
      const timestamp =
        log.called_at ?? log.createdAt;

      return (
        getIndiaDate(timestamp) === today
      );
    });

    /*
     * =========================================================
     * OUTCOME COUNTS
     * =========================================================
     */

    const outcomeCounts = {
      CONNECTED: 0,
      NO_ANSWER: 0,
      CALLBACK: 0,
      ESCALATED: 0,
    };

    for (const log of allLogs) {
      if (
        log.outcome &&
        log.outcome in outcomeCounts
      ) {
        outcomeCounts[
          log.outcome as keyof typeof outcomeCounts
        ]++;
      }
    }

    /*
     * =========================================================
     * AGENT STATISTICS
     * =========================================================
     */

    const agentStats = allAgents.map(
      (agent) => {
        const agentLogs = allLogs.filter(
          (log) =>
            log.agent_id === agent.id
        );

        const agentTodayLogs =
          todayLogs.filter(
            (log) =>
              log.agent_id === agent.id
          );

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          isActive: agent.isActive,

          totalCalls:
            agentLogs.length,

          callsToday:
            agentTodayLogs.length,

          connected:
            agentLogs.filter(
              (log) =>
                log.outcome ===
                "CONNECTED"
            ).length,

          noAnswer:
            agentLogs.filter(
              (log) =>
                log.outcome ===
                "NO_ANSWER"
            ).length,

          callback:
            agentLogs.filter(
              (log) =>
                log.outcome ===
                "CALLBACK"
            ).length,

          escalated:
            agentLogs.filter(
              (log) =>
                log.outcome ===
                "ESCALATED"
            ).length,
        };
      }
    );

    /*
     * =========================================================
     * DAILY CALL GRAPH
     *
     * We use the last 30 days.
     *
     * Each object looks like:
     *
     * {
     *   date: "Sep 20",
     *   fullDate: "2026-09-20",
     *   "agent-id-1": 8,
     *   "agent-id-2": 5
     * }
     *
     * The frontend converts agent IDs into
     * agent names for the graph.
     * =========================================================
     */

    const dailyAgentMap =
      new Map<
        string,
        Record<string, number>
      >();

    /*
     * Create the last 30 calendar days first.
     *
     * This is important because dates with zero
     * calls should still appear on the graph.
     */

    const todayDate = new Date();

    for (
      let i = 29;
      i >= 0;
      i--
    ) {
      const date = new Date(
        todayDate
      );

      date.setDate(
        date.getDate() - i
      );

      const dateString =
        getIndiaDate(
          date.toISOString()
        );

      if (dateString) {
        dailyAgentMap.set(
          dateString,
          {}
        );
      }
    }

    /*
     * Count calls for each agent on each day.
     */

    for (const log of allLogs) {
      const timestamp =
        log.called_at ?? log.createdAt;

      const date =
        getIndiaDate(timestamp);

      if (!date) {
        continue;
      }

      /*
       * Only include the last 30 days.
       */

      if (
        !dailyAgentMap.has(date)
      ) {
        continue;
      }

      if (!log.agent_id) {
        continue;
      }

      const existing =
        dailyAgentMap.get(date) ?? {};

      existing[log.agent_id] =
        (existing[log.agent_id] ?? 0) +
        1;

      dailyAgentMap.set(
        date,
        existing
      );
    }

    /*
     * Convert map to API response format.
     */

    const dailyAgentCalls =
      Array.from(
        dailyAgentMap.entries()
      ).map(
        ([date, agentCounts]) => {
          return {
            date,
            agents: agentCounts,
          };
        }
      );

    /*
     * =========================================================
     * RESPONSE
     * =========================================================
     */

    return NextResponse.json({
      success: true,

      summary: {
        totalCalls: allLogs.length,
        callsToday: todayLogs.length,
        connected:
          outcomeCounts.CONNECTED,
        noAnswer:
          outcomeCounts.NO_ANSWER,
        callback:
          outcomeCounts.CALLBACK,
        escalated:
          outcomeCounts.ESCALATED,
      },

      agents: agentStats,

      dailyAgentCalls,
    });
  } catch (error) {
    console.error(
      "KPI error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load KPI data";

    if (
      message ===
      "UNAUTHENTICATED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required",
        },
        { status: 401 }
      );
    }

    if (
      message ===
      "CRM_USER_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CRM user not found",
        },
        { status: 403 }
      );
    }

    if (
      message === "USER_INACTIVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User account is inactive",
        },
        { status: 403 }
      );
    }

    if (
      message ===
      "DOMAIN_NOT_ALLOWED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only @inditronics.com accounts can access this portal",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load KPI data",
      },
      { status: 500 }
    );
  }
}

