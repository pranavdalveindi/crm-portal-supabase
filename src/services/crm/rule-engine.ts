import type { CRMRule } from "@/src/types/crm";
import type { EventRow } from "./event.service";

export interface EvaluationResult {
  qualifies: boolean;
  daysAffected: number;
  reason: string;
}

interface DayEvents {
  date: string;
  events: EventRow[];
}

interface Member {
  active?: boolean;
}

function toDateString(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function getWindowDates(lookbackDays: number): string[] {
  const dates: string[] = [];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = lookbackDays; i >= 1; i--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

function groupEventsByDay(
  events: EventRow[]
): Map<string, EventRow[]> {
  const grouped = new Map<string, EventRow[]>();

  for (const event of events) {
    const date = toDateString(event.timestamp);

    if (!grouped.has(date)) {
      grouped.set(date, []);
    }

    grouped.get(date)!.push(event);
  }

  return grouped;
}

function evaluateDay(
  rule: CRMRule,
  events: EventRow[]
): boolean {
  const eventType = rule.event_type;

  /*
   * Rule 1
   * Type 42 - Audio Fingerprint
   *
   * Day qualifies if there is an UNMATCHED
   * fingerprint event during the day.
   */
  if (eventType === 42) {
    return events.some(
      (event) =>
        String(event.details?.status ?? "").toUpperCase() ===
        "UNMATCHED"
    );
  }

  /*
   * Rule 2
   * Type 3 - Member Declaration
   *
   * Day qualifies only when every member has
   * active === false.
   */
  if (eventType === 3) {
    if (events.length === 0) {
      return false;
    }

    return events.some((event) => {
      const members = event.details?.members;

      if (!Array.isArray(members) || members.length === 0) {
        return false;
      }

      return (members as Member[]).every(
        (member) => member.active === false
      );
    });
  }

  /*
   * Rule 3
   * Type 30 - Image Unrecognized
   *
   * Day qualifies if there is an unrecognized
   * image event during the day.
   */
  if (eventType === 30) {
    return events.some(
      (event) =>
        String(event.details?.status ?? "").toLowerCase() ===
        "unrecognized"
    );
  }

  /*
   * Rule 4
   * Type 36 - Connectivity
   *
   * Day qualifies if strength is 0.
   */
  if (eventType === 36) {
    return events.some(
      (event) => Number(event.details?.strength) === 0
    );
  }

  /*
   * Rule 5
   * Type 29 - Viewership
   *
   * A day qualifies when there is NO recognized
   * viewership event for that meter.
   *
   * No events -> qualifies.
   * Only non-recognized events -> qualifies.
   * At least one recognized event -> does not qualify.
   */
  if (eventType === 29) {
    const hasRecognizedViewership = events.some(
      (event) =>
        String(event.details?.status ?? "").toLowerCase() ===
        "recognized"
    );

    return !hasRecognizedViewership;
  }

  return false;
}

export function evaluateRule(
  rule: CRMRule,
  events: EventRow[]
): EvaluationResult {
  const dates = getWindowDates(rule.lookback_days);
  const grouped = groupEventsByDay(events);

  const minDays =
    Number(rule.condition?.min_days) ||
    rule.lookback_days;

  const dayResults: DayEvents[] = dates.map((date) => ({
    date,
    events: grouped.get(date) ?? [],
  }));

  let consecutiveDays = 0;

  for (const day of dayResults) {
    const qualifies = evaluateDay(
      rule,
      day.events
    );

    if (qualifies) {
      consecutiveDays++;
    } else {
      consecutiveDays = 0;
    }
  }

  const qualifies = consecutiveDays >= minDays;

  return {
    qualifies,
    daysAffected: qualifies ? consecutiveDays : 0,
    reason: qualifies
      ? `${rule.name}: condition met for ${consecutiveDays} consecutive day(s)`
      : "",
  };
}