"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VCInvitePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/validate-invite-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode, role: "vc" }),
      });
      const data = await res.json();

      if (!data.valid) {
        setError(data.error || "Invalid invite code");
        setLoading(false);
        return;
      }

      // Code is valid — pass it to the signup page via query param
      router.push(
        `/signup/vc?code=${encodeURIComponent(inviteCode)}&codeId=${data.codeId}`
      );
    } catch {
      setError("Failed to validate code. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 system-grid-bg">
      <div className="w-full max-w-sm">
        {/* Status indicator */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
          <span className="system-label">access verification</span>
        </div>

        {/* System module card */}
        <div className="rounded-lg border border-border bg-card p-8 system-glow">
          <div className="mb-8 text-center">
            <h1 className="text-sm font-medium uppercase tracking-[0.1em]">
              Investor Access
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="system-label">
                Invite Code
              </Label>
              <Input
                id="inviteCode"
                placeholder="XXXX-XXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                autoFocus
                className="font-mono tracking-widest text-center text-lg py-3"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="mt-1 w-full border border-primary/30 bg-transparent px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_20px_oklch(0.65_0.2_45/10%)] disabled:opacity-50"
            >
              {loading ? "Verifying..." : "[ Verify Code ]"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary/80 hover:text-primary transition-colors"
            >
              Log in
            </Link>
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            Are you a founder?{" "}
            <Link
              href="/invite/founder"
              className="text-primary/80 hover:text-primary transition-colors"
            >
              Founder access
            </Link>
          </div>
        </div>

        <div className="mt-4 glow-line" />
      </div>
    </div>
  );
}
