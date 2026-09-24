import { createServerClient } from "@/src/lib/supabase/server";

export interface EventRow {
  id: number;
  device_id: string;
  timestamp: number;
  type: number;
  details: Record<string, unknown>;
  createdAt: string;
}

export async function getEventsForDevices(
  deviceIds: string[],
  eventType: number,
  startTimestamp: number,
  endTimestamp: number
): Promise<EventRow[]> {
  if (deviceIds.length === 0) {
    return [];
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("device_id", deviceIds)
    .eq("type", eventType)
    .gte("timestamp", startTimestamp)
    .lt("timestamp", endTimestamp)
    .order("timestamp", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return (data ?? []) as EventRow[];
}