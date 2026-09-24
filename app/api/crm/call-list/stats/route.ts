import { NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabase/server";
import { getCurrentCRMUser } from "@/src/services/crm/auth-service";

export async function GET() {
  try {
    const currentUser = await getCurrentCRMUser();

    const supabase = createServerClient();

    /*
     * Base queries
     *
     * Call agents only see statistics for their
     * own assigned calls.
     *
     * Panel managers / developers see all calls.
     */
    let totalQuery = supabase
      .from("crm_call_list")
      .select("id", {
        count: "exact",
        head: true,
      });

    let pendingQuery = supabase
      .from("crm_call_list")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "PENDING");

    let inProgressQuery = supabase
      .from("crm_call_list")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "IN_PROGRESS");

    let completedQuery = supabase
      .from("crm_call_list")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "COMPLETED");

    /*
     * Restrict call-agent statistics to their
     * assigned calls.
     */
    if (currentUser.role === "call_agent") {
      totalQuery = totalQuery.eq(
        "assigned_to",
        currentUser.id
      );

      pendingQuery = pendingQuery.eq(
        "assigned_to",
        currentUser.id
      );

      inProgressQuery = inProgressQuery.eq(
        "assigned_to",
        currentUser.id
      );

      completedQuery = completedQuery.eq(
        "assigned_to",
        currentUser.id
      );
    }

    /*
     * Run all count queries in parallel.
     */
    const [
      totalResult,
      pendingResult,
      inProgressResult,
      completedResult,
    ] = await Promise.all([
      totalQuery,
      pendingQuery,
      inProgressQuery,
      completedQuery,
    ]);

    /*
     * Check for database errors.
     */
    const error =
      totalResult.error ||
      pendingResult.error ||
      inProgressResult.error ||
      completedResult.error;

    if (error) {
      throw new Error(
        `Failed to fetch call list statistics: ${error.message}`
      );
    }

    /*
     * Return statistics.
     */
    return NextResponse.json({
      success: true,
      stats: {
        total: totalResult.count ?? 0,
        pending: pendingResult.count ?? 0,
        inProgress: inProgressResult.count ?? 0,
        completed: completedResult.count ?? 0,
      },
    });
  } catch (error) {
    console.error(
      "Call list stats error:",
      error
    );

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
        error: "Failed to fetch call list statistics",
      },
      { status: 500 }
    );
  }
}