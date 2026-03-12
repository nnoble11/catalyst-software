"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function InviteCofounderForm({ startupId }: { startupId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    // Check if already a founder
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (existingProfile) {
      const { data: existingLink } = await supabase
        .from("startup_founders")
        .select("founder_id")
        .eq("startup_id", startupId)
        .eq("founder_id", existingProfile.id)
        .single();

      if (existingLink) {
        setError("This person is already a team member.");
        setLoading(false);
        return;
      }
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from("startup_invites")
      .select("id, status")
      .eq("startup_id", startupId)
      .eq("invitee_email", email.trim().toLowerCase())
      .single();

    if (existingInvite) {
      if (existingInvite.status === "pending") {
        setError("An invite has already been sent to this email.");
      } else if (existingInvite.status === "accepted") {
        setError("This person has already accepted an invite.");
      } else {
        // Previously declined — allow re-invite by updating
        const { error: updateErr } = await supabase
          .from("startup_invites")
          .update({ status: "pending", created_at: new Date().toISOString() })
          .eq("id", existingInvite.id);

        if (updateErr) {
          setError(updateErr.message);
        } else {
          setMessage("Invite re-sent successfully!");
          setEmail("");
        }
      }
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("startup_invites")
      .insert({
        startup_id: startupId,
        inviter_id: user.id,
        invitee_email: email.trim().toLowerCase(),
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage("Invite sent!");
      setEmail("");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleInvite} className="flex gap-2">
      <Input
        type="email"
        placeholder="co-founder@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="text-xs flex-1"
      />
      <button
        type="submit"
        disabled={loading}
        className="shrink-0 border border-primary/30 bg-transparent px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50"
      >
        {loading ? "..." : "Invite"}
      </button>
      {error && <p className="text-xs text-destructive self-center">{error}</p>}
      {message && <p className="text-xs text-green-500 self-center">{message}</p>}
    </form>
  );
}
