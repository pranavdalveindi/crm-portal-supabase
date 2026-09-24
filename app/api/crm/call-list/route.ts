import { NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabase/server";
import { getCurrentCRMUser } from "@/src/services/crm/auth-service";

export async function GET() {
  try {
    const currentUser = await getCurrentCRMUser();

    const supabase = createServerClient();

    let query = supabase
      .from("crm_call_list")
      .select(`
        id,
        generated_at,
        device_id,
        household_id,
        hhid,
        rule_id,
        rule_name,
        priority,
        reason,
        days_affected,
        assigned_to,
        status,
        locked_at,
        createdAt,
        updatedAt
      `)
      .eq("status", "PENDING");

    // Call agents only see their own pending calls.
    if (currentUser.role === "call_agent") {
      query = query.eq("assigned_to", currentUser.id);
    }

    const { data, error } = await query
      .order("priority", { ascending: false })
      .order("createdAt", { ascending: true });

    if (error) {
      console.error("Call list fetch error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length ?? 0,
      callList: data ?? [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);

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
            error:
              "Only @inditronics.com accounts can access this portal",
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch call list",
      },
      { status: 500 }
    );
  }
}