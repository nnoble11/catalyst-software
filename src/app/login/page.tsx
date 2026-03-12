"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 system-grid-bg">
      <div className="w-full max-w-md">
        {/* Status indicator */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
          <span className="system-label">secure connection established</span>
        </div>

        {/* System module card */}
        <div className="rounded-lg border border-border bg-card p-8 system-glow">
          <div className="mb-8 text-center">
            <div className="mb-4 text-2xl font-bold tracking-tight">
              catalyst <span className="text-primary">sonar</span>
            </div>
            <h1 className="text-sm font-medium uppercase tracking-[0.1em]">System Access</h1>
            <p className="mt-1 text-xs text-muted-foreground tracking-wide">
              authenticate to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="system-label">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="system-label">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full border border-primary/30 bg-transparent px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_20px_oklch(0.65_0.2_45/10%)] disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "[ Access System ]"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup/founder"
              className="text-primary/80 hover:text-primary transition-colors"
            >
              Founder
            </Link>{" "}
            or{" "}
            <Link
              href="/signup/vc"
              className="text-primary/80 hover:text-primary transition-colors"
            >
              Investor
            </Link>
          </div>
        </div>

        <div className="mt-4 glow-line" />
      </div>
    </div>
  );
}
