import { NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("crm_rules")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);

      return NextResponse.json(
        {
          error: "Failed to fetch CRM rules",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rules: data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}