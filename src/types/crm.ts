export type CRMUserRole =
  | "panel_manager"
  | "call_agent"
  | "developer";

export type CRMRulePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type CRMCallListStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface CRMRuleCondition {
  status?: string;
  mode?: string;
  min_days?: number;
  connectivity?: boolean;
}

export interface CRMRule {
  id: string;
  name: string;
  description: string | null;
  event_type: number;
  lookback_days: number;
  priority: CRMRulePriority;
  is_active: boolean;
  created_by: string;
  condition: CRMRuleCondition;
  createdAt: string;
  updatedAt: string;
}

export interface CRMCallList {
  id: string;
  generated_at: string;
  device_id: string;
  household_id: string | null;
  hhid: string | null;
  rule_id: string | null;
  rule_name: string | null;
  priority: CRMRulePriority;
  reason: string | null;
  days_affected: number | null;
  assigned_to: string | null;
  status: CRMCallListStatus;
  locked_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CRMCallLog {
  id: string;
  call_list_id: string | null;
  agent_id: string;
  device_id: string | null;
  household_id: string | null;
  called_at: string | null;
  duration_seconds: number | null;
  twilio_call_sid: string | null;
  twilio_status: string | null;
  recording_s3_url: string | null;
  outcome: string | null;
  issue_tags: string[] | null;
  notes: string | null;
  escalated_to: string | null;
  createdAt: string;
  updatedAt: string;
}