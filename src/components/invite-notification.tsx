"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface InviteNotificationProps {
  invite: {
    id: string;
    startup_id: string;
    startup: { name: string } | null;
    inviter: { full_name: string } | null;
    created_at: string;
  };
}

export function InviteNotification({ invite }: InviteNotificationProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function respond(accept: boolean) {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Update invite status
    await supabase
      .from("startup_invites")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", invite.id);

    // If accepted, add as co-founder
    if (accept) {
      await supabase.from("startup_founders").insert({
        startup_id: invite.startup_id,
        founder_id: user.id,
        role: "co_founder",
      });
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 system-glow-hover transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
        <span className="system-label">team invite</span>
      </div>
      <p className="text-sm mb-1">
        <span className="font-medium">{invite.inviter?.full_name || "Someone"}</span>{" "}
        invited you to join{" "}
        <span className="font-medium text-primary">{invite.startup?.name || "a startup"}</span>
      </p>
      <p className="text-[0.6rem] text-muted-foreground mb-3">
        {new Date(invite.created_at).toLocaleDateString()}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => respond(true)}
          disabled={loading}
          className="border border-primary/30 bg-transparent px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50"
        >
          Accept
        </button>
        <button
          onClick={() => respond(false)}
          disabled={loading}
          className="border border-border bg-transparent px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-muted-foreground transition-all hover:border-foreground/20 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
