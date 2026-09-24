import { createServerClient } from "@/src/lib/supabase/server";

interface CallListItem {
  id: string;
}

interface CallAgent {
  id: string;
  name: string;
}

export async function distributeCallList(): Promise<{
  assigned: number;
  agents: number;
}> {
  const supabase = createServerClient();

  // Get active call agents
  const { data: agents, error: agentsError } = await supabase
    .from("crm_users")
    .select("id, name")
    .eq("role", "call_agent")
    .eq("isActive", true)
    .order("name", { ascending: true });

  if (agentsError) {
    throw new Error(
      `Failed to fetch call agents: ${agentsError.message}`
    );
  }

  const callAgents = (agents ?? []) as CallAgent[];

  if (callAgents.length === 0) {
    throw new Error("No active call agents available");
  }

  // Get today's unassigned calls
  const today = new Date().toISOString().slice(0, 10);

  const { data: calls, error: callsError } = await supabase
    .from("crm_call_list")
    .select("id")
    .eq("generated_at", today)
    .eq("status", "PENDING")
    .is("assigned_to", null)
    .order("createdAt", { ascending: true });

  if (callsError) {
    throw new Error(
      `Failed to fetch unassigned calls: ${callsError.message}`
    );
  }

  const callList = (calls ?? []) as CallListItem[];

  if (callList.length === 0) {
    return {
      assigned: 0,
      agents: callAgents.length,
    };
  }

  // Round-robin assignment
  for (let i = 0; i < callList.length; i++) {
    const agent = callAgents[i % callAgents.length];
    const call = callList[i];

    const { error } = await supabase
      .from("crm_call_list")
      .update({
        assigned_to: agent.id,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", call.id)
      .eq("status", "PENDING")
      .is("assigned_to", null);

    if (error) {
      throw new Error(
        `Failed to assign call ${call.id}: ${error.message}`
      );
    }
  }

  return {
    assigned: callList.length,
    agents: callAgents.length,
  };
}