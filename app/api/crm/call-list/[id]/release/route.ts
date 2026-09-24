import { NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabase/server";
import { getCurrentCRMUser } from "@/src/services/crm/auth-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Get the authenticated CRM user from the Supabase session
    const currentUser = await getCurrentCRMUser();

    const supabase = createServerClient();

    // Find the call
    const { data: callItem, error: fetchError } = await supabase
      .from("crm_call_list")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !callItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Call list item not found",
        },
        { status: 404 }
      );
    }

    // Call must currently be in progress
    if (callItem.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          success: false,
          error: `Call is ${callItem.status}, expected IN_PROGRESS`,
        },
        { status: 409 }
      );
    }

    // Only the agent who claimed the call can release it
    if (callItem.assigned_to !== currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: "This call is assigned to another agent",
        },
        { status: 403 }
      );
    }

    // Release the call
    const { data, error } = await supabase
      .from("crm_call_list")
      .update({
        status: "PENDING",
        assigned_to: null,
        locked_at: null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "IN_PROGRESS")
      .eq("assigned_to", currentUser.id)
      .select("*")
      .single();

    if (error) {
      console.error("Call release error:", error);

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
      callList: data,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
    });
  } catch (error) {
    console.error("Unexpected release error:", error);

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
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to release call",
      },
      { status: 500 }
    );
  }
}