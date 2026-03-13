import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { codeId, userId } = await req.json();

    if (!codeId || !userId) {
      return NextResponse.json(
        { error: "codeId and userId are required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL env var");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Increment uses_count
    const { error: updateError } = await supabase.rpc("increment_invite_uses", {
      p_code_id: codeId,
    });

    if (updateError) {
      console.error("Failed to increment invite uses:", updateError);
      return NextResponse.json(
        { error: "Failed to redeem invite code" },
        { status: 500 }
      );
    }

    // Record the use
    const { error: insertError } = await supabase
      .from("invite_code_uses")
      .insert({ code_id: codeId, user_id: userId });

    if (insertError) {
      console.error("Failed to record invite code use:", insertError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Redeem invite code error:", err);
    return NextResponse.json(
      { error: "Failed to redeem invite code" },
      { status: 500 }
    );
  }
}
