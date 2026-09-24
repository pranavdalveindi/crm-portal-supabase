import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/src/lib/supabase/server-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = body.email;
    const password = body.password;

    if (!email || !password) {
    return NextResponse.json(
        {
        success: false,
        error: "Email and password are required",
        },
        { status: 400 }
    );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@inditronics.com")) {
    return NextResponse.json(
        {
        success: false,
        error: "Only @inditronics.com accounts can access this portal",
        },
        { status: 403 }
    );
    }

    

    const supabase = await createAuthServerClient();

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
      },
      { status: 500 }
    );
  }
}