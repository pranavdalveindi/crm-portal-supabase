import { createServerClient } from "@/src/lib/supabase/server";
import { getEventsForDevices } from "./event.service";
import { evaluateRule } from "./rule-engine";
import type { CRMRule } from "@/src/types/crm";

interface MeterAssignment {
  meter_id: string;
  household_id: string;
  meters: {
    meter_id: string;
  };
  households: {
    hhid: string;
  };
}

function getIndiaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function generateCallList() {
  const supabase = createServerClient();

  // Always use India calendar date for CRM call-list generation.
  const today = getIndiaDate();

  /*
   * 1. Load active rules
   */
  const { data: rules, error: rulesError } = await supabase
    .from("crm_rules")
    .select("*")
    .eq("is_active", true)
    .order("createdAt", { ascending: true });

  if (rulesError) {
    throw new Error(
      `Failed to load CRM rules: ${rulesError.message}`
    );
  }

  /*
   * 2. Load assigned meters + households
   */
  const { data: assignments, error: assignmentError } =
    await supabase
      .from("meter_assignments")
      .select(`
        meter_id,
        household_id,
        meters!inner (
          meter_id
        ),
        households!inner (
          hhid
        )
      `);

  if (assignmentError) {
    throw new Error(
      `Failed to load meter assignments: ${assignmentError.message}`
    );
  }

  const typedRules = (rules ?? []) as CRMRule[];

  const typedAssignments =
    (assignments ?? []) as unknown as MeterAssignment[];

  const results = [];

  /*
   * 3. Evaluate every rule against every assigned meter
   */
  for (const rule of typedRules) {
    const deviceIds = typedAssignments.map(
      (assignment) => assignment.meters.meter_id
    );

    if (deviceIds.length === 0) {
      continue;
    }

    const now = Math.floor(Date.now() / 1000);

    const endTimestamp = now;

    const startTimestamp =
      now - rule.lookback_days * 24 * 60 * 60;

    const events = await getEventsForDevices(
      deviceIds,
      rule.event_type,
      startTimestamp,
      endTimestamp
    );

    /*
     * Evaluate each meter separately.
     */
    for (const assignment of typedAssignments) {
      const deviceEvents = events.filter(
        (event) =>
          event.device_id === assignment.meters.meter_id
      );

      const evaluation = evaluateRule(
        rule,
        deviceEvents
      );

      if (!evaluation.qualifies) {
        continue;
      }

      results.push({
        generated_at: today,
        device_id: assignment.meters.meter_id,
        household_id: assignment.household_id,
        hhid: assignment.households.hhid,
        rule_id: rule.id,
        rule_name: rule.name,
        priority: rule.priority,
        reason: evaluation.reason,
        days_affected: evaluation.daysAffected,
        status: "PENDING",
      });
    }
  }

  /*
   * 4. Prevent duplicates.
   *
   * We do NOT delete today's existing calls.
   *
   * This is important because an automatic job may run more than once.
   */
  if (results.length === 0) {
    return [];
  }

  /*
   * Load today's existing call-list entries.
   */
  const { data: existingCalls, error: existingError } =
    await supabase
      .from("crm_call_list")
      .select("device_id, rule_id")
      .eq("generated_at", today);

  if (existingError) {
    throw new Error(
      `Failed to check existing call list: ${existingError.message}`
    );
  }

  const existingKeys = new Set(
    (existingCalls ?? []).map(
      (call) => `${call.device_id}:${call.rule_id}`
    )
  );

  /*
   * Only insert calls that don't already exist today.
   */
  const newResults = results.filter((result) => {
    const key = `${result.device_id}:${result.rule_id}`;

    if (existingKeys.has(key)) {
      return false;
    }

    existingKeys.add(key);
    return true;
  });

  if (newResults.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("crm_call_list")
    .insert(newResults)
    .select("*");

  if (error) {
    throw new Error(
      `Failed to insert call list: ${error.message}`
    );
  }

  return data ?? [];
}