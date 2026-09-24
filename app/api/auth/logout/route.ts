import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/src/lib/supabase/server-auth";

export async function POST() {
  try {
    const supabase = await createAuthServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to log out",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to log out",
      },
      { status: 500 }
    );
  }
}
