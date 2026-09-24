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

    // Get all call logs
    const { data: logs, error: logsError } = await supabase
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

    // Get active call agents
    const { data: agents, error: agentsError } = await supabase
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
      console.error("KPI agents error:", agentsError);

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

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const todayLogs = allLogs.filter((log) => {
      const date = log.called_at ?? log.createdAt;

      if (!date) {
        return false;
      }

      return date.slice(0, 10) === today;
    });

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

    const agentStats = allAgents.map((agent) => {
      const agentLogs = allLogs.filter(
        (log) => log.agent_id === agent.id
      );

      const agentTodayLogs = todayLogs.filter(
        (log) => log.agent_id === agent.id
      );

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        isActive: agent.isActive,
        totalCalls: agentLogs.length,
        callsToday: agentTodayLogs.length,
        connected: agentLogs.filter(
          (log) => log.outcome === "CONNECTED"
        ).length,
        noAnswer: agentLogs.filter(
          (log) => log.outcome === "NO_ANSWER"
        ).length,
        callback: agentLogs.filter(
          (log) => log.outcome === "CALLBACK"
        ).length,
        escalated: agentLogs.filter(
          (log) => log.outcome === "ESCALATED"
        ).length,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalCalls: allLogs.length,
        callsToday: todayLogs.length,
        connected: outcomeCounts.CONNECTED,
        noAnswer: outcomeCounts.NO_ANSWER,
        callback: outcomeCounts.CALLBACK,
        escalated: outcomeCounts.ESCALATED,
      },
      agents: agentStats,
    });
  } catch (error) {
    console.error("KPI error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load KPI data";

    if (
      message === "UNAUTHENTICATED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load KPI data",
      },
      { status: 500 }
    );
  }
}