import { NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabase/server";
import { getCurrentCRMUser } from "@/src/services/crm/auth-service";

export async function POST(request: Request) {
  try {
    // Get authenticated CRM user
    const currentUser = await getCurrentCRMUser();

    // Only call agents can create call logs
    if (currentUser.role !== "call_agent") {
      return NextResponse.json(
        {
          success: false,
          error: "Only call agents can create call logs",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      call_list_id,
      device_id,
      household_id,
      called_at,
      duration_seconds,
      twilio_call_sid,
      twilio_status,
      recording_s3_url,
      outcome,
      issue_tags,
      notes,
      escalated_to,
    } = body;

    if (!call_list_id) {
      return NextResponse.json(
        {
          success: false,
          error: "call_list_id is required",
        },
        { status: 400 }
      );
    }

    if (!outcome) {
      return NextResponse.json(
        {
          success: false,
          error: "outcome is required",
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get the call
    const { data: callItem, error: callError } = await supabase
      .from("crm_call_list")
      .select("*")
      .eq("id", call_list_id)
      .single();

    if (callError || !callItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Call list item not found",
        },
        { status: 404 }
      );
    }

    // Make sure this call belongs to the authenticated agent
    if (callItem.assigned_to !== currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: "This call is assigned to another agent",
        },
        { status: 403 }
      );
    }

    // Prevent duplicate completion
    if (callItem.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "This call has already been completed",
        },
        { status: 409 }
      );
    }

    // Create call log
    const { data: log, error: logError } = await supabase
      .from("crm_call_logs")
      .insert({
        call_list_id,
        agent_id: currentUser.id,
        device_id: device_id ?? callItem.device_id,
        household_id: household_id ?? callItem.household_id,
        called_at: called_at ?? new Date().toISOString(),
        duration_seconds: duration_seconds ?? null,
        twilio_call_sid: twilio_call_sid ?? null,
        twilio_status: twilio_status ?? null,
        recording_s3_url: recording_s3_url ?? null,
        outcome,
        issue_tags: issue_tags ?? null,
        notes: notes ?? null,
        escalated_to: escalated_to ?? null,
      })
      .select("*")
      .single();

    if (logError) {
      console.error("Call log creation error:", logError);

      return NextResponse.json(
        {
          success: false,
          error: logError.message,
        },
        { status: 500 }
      );
    }

    // Mark call as completed
    const { data: updatedCall, error: updateError } = await supabase
      .from("crm_call_list")
      .update({
        status: "COMPLETED",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", call_list_id)
      .eq("assigned_to", currentUser.id)
      .neq("status", "COMPLETED")
      .select("*")
      .single();

    if (updateError) {
      console.error("Call completion update error:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
          callLog: log,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      callLog: log,
      callList: updatedCall,
    });
  } catch (error) {
    console.error("Unexpected call-log error:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED") {
        return NextResponse.json(
          {
            success: false,
            error: "Not authenticated",
          },
          { status: 401 }
        );
      }

      if (error.message === "CRM_USER_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            error: "CRM user not found",
          },
          { status: 403 }
        );
      }

      if (error.message === "USER_INACTIVE") {
        return NextResponse.json(
          {
            success: false,
            error: "User account is inactive",
          },
          { status: 403 }
        );
      }

      if (error.message === "DOMAIN_NOT_ALLOWED") {
        return NextResponse.json(
          {
            success: false,
            error: "Only @inditronics.com accounts can access this portal",
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create call log",
      },
      { status: 500 }
    );
  }
}