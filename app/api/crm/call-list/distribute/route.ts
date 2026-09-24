import { NextResponse } from "next/server";
import { distributeCallList } from "@/src/services/crm/call-distribution.service";
import { getCurrentCRMUser } from "@/src/services/crm/auth-service";

export async function POST() {
  try {
    const currentUser = await getCurrentCRMUser();

    // Only panel managers can distribute calls
    if (currentUser.role !== "panel_manager") {
      return NextResponse.json(
        {
          success: false,
          error: "Only panel managers can distribute call lists",
        },
        { status: 403 }
      );
    }

    const result = await distributeCallList();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Call distribution error:", error);

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

      if (error.message === "No active call agents available") {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to distribute call list",
      },
      { status: 500 }
    );
  }
}