import { NextResponse } from "next/server";
import { generateCallList } from "@/src/services/crm/call-list.service";

export async function POST() {
  try {
    const callList = await generateCallList();

    return NextResponse.json({
      success: true,
      count: callList.length,
      callList,
    });
  } catch (error) {
    console.error(
      "Call list generation failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate call list",
      },
      { status: 500 }
    );
  }
}