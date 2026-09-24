
import { NextResponse } from "next/server";
import { getCurrentCRMUser } from "@/src/services/crm/auth-service";

export async function GET() {
  try {
    const user = await getCurrentCRMUser();

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Auth/me error:", error);

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
        error: "Authentication check failed",
      },
      { status: 500 }
    );
  }
}

