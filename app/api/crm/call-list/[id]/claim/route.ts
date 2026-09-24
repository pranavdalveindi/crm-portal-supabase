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

    // Get authenticated CRM user from Supabase session
    const currentUser = await getCurrentCRMUser();

    const supabase = createServerClient();

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

    if (callItem.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Call is already ${callItem.status}`,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("crm_call_list")
      .update({
        assigned_to: currentUser.id,
        status: "IN_PROGRESS",
        locked_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "PENDING")
      .select("*")
      .single();

    if (error) {
      console.error("Call claim error:", error);

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
    console.error("Unexpected claim error:", error);

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
            : "Failed to claim call",
      },
      { status: 500 }
    );
  }
}