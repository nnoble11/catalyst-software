"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VCSignupPage() {
  return (
    <Suspense>
      <VCSignupInner />
    </Suspense>
  );
}

function VCSignupInner() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code") || "";
  const codeId = searchParams.get("codeId") || "";
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    firmName: "",
    title: "",
    linkedinUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect back if no code provided
  useEffect(() => {
    if (!inviteCode || !codeId) {
      router.replace("/invite/vc");
    }
  }, [inviteCode, codeId, router]);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          role: "vc",
          full_name: formData.fullName,
          firm_name: formData.firmName,
          title: formData.title,
          linkedin_url: formData.linkedinUrl || null,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Redeem the invite code
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      await fetch("/api/redeem-invite-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId, userId: authData.user.id }),
      });
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (!inviteCode || !codeId) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 system-grid-bg">
      <div className="w-full max-w-md">
        {/* Status indicator */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
          <span className="system-label">registration module active</span>
        </div>

        {/* System module card */}
        <div className="rounded-lg border border-border bg-card p-8 system-glow">
          <div className="mb-8 text-center">
            <h1 className="text-sm font-medium uppercase tracking-[0.1em]">Create Investor Profile</h1>
            <p className="mt-1 text-xs text-muted-foreground tracking-wide">
              register to discover student startups
            </p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="system-label">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="system-label">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@vcfirm.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="system-label">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firmName" className="system-label">Firm Name</Label>
              <Input
                id="firmName"
                placeholder="Sequoia Capital"
                value={formData.firmName}
                onChange={(e) => updateField("firmName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title" className="system-label">Your Title</Label>
              <Input
                id="title"
                placeholder="Partner, Analyst, etc."
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="system-label">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/johndoe"
                value={formData.linkedinUrl}
                onChange={(e) => updateField("linkedinUrl", e.target.value)}
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
              {loading ? "Creating profile..." : "[ Initialize Profile ]"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary/80 hover:text-primary transition-colors">
              Log in
            </Link>
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            Are you a founder?{" "}
            <Link href="/invite/founder" className="text-primary/80 hover:text-primary transition-colors">
              Founder access
            </Link>
          </div>
        </div>

        <div className="mt-4 glow-line" />
      </div>
    </div>
  );
}
