import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { code, role } = await req.json();

    if (!code || !role) {
      return NextResponse.json(
        { valid: false, error: "Code and role are required" },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS (user isn't authenticated during signup)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: invite, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { valid: false, error: "Invalid invite code" },
        { status: 400 }
      );
    }

    // Check active
    if (!invite.is_active) {
      return NextResponse.json(
        { valid: false, error: "This invite code is no longer active" },
        { status: 400 }
      );
    }

    // Check expiration
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "This invite code has expired" },
        { status: 400 }
      );
    }

    // Check usage limits
    if (invite.type === "single_use" && invite.uses_count >= 1) {
      return NextResponse.json(
        { valid: false, error: "This invite code has already been used" },
        { status: 400 }
      );
    }

    if (invite.type === "multi_use" && invite.uses_count >= invite.max_uses) {
      return NextResponse.json(
        { valid: false, error: "This invite code has reached its usage limit" },
        { status: 400 }
      );
    }

    // Check role restriction
    if (invite.role_restriction !== "any" && invite.role_restriction !== role) {
      return NextResponse.json(
        { valid: false, error: "This invite code is not valid for your role" },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true, codeId: invite.id });
  } catch (err) {
    console.error("Validate invite code error:", err);
    return NextResponse.json(
      { valid: false, error: "Failed to validate invite code" },
      { status: 500 }
    );
  }
}
