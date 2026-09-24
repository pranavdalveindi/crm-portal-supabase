export type CRMUserRole =
  | "developer"
  | "panel_manager"
  | "call_agent";

export type Priority =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type CallListStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED";

export type CallOutcome =
  | "CONNECTED"
  | "NO_ANSWER"
  | "CALLBACK"
  | "ESCALATED";

export interface CRMUser {
  id: string;
  authUserId?: string;
  email: string;
  name: string;
  role: CRMUserRole;
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface Rule {
  id: string;
  name: string;
  description?: string | null;

  event_type: number;
  eventType?: number;

  lookback_days: number;
  lookbackDays?: number;

  priority: Priority;

  is_active: boolean;
  isActive?: boolean;

  created_by?: string;

  condition: Record<string, unknown>;

  createdAt?: string;
  updatedAt?: string;
}

export interface CallListEntry {
  id: string;
  generated_at: string;

  device_id: string;

  household_id?: string | null;
  hhid?: string | null;

  rule_id?: string | null;
  rule_name?: string | null;

  priority: Priority;

  reason?: string | null;
  days_affected?: number | null;

  assigned_to?: string | null;

  status: CallListStatus;

  locked_at?: string | null;

  createdAt?: string;
  updatedAt?: string;
}
