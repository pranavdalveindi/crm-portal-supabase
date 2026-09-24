import { NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("meter_assignments")
      .select(`
        meter_id,
        household_id,
        meters!inner (
          meter_id
        ),
        households!inner (
          hhid
        )
      `)
      .limit(5);

    if (error) {
      console.error("Supabase assignment error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length ?? 0,
      assignments: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}