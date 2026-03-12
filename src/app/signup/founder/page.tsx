"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FounderSignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    school: "",
    graduationYear: "",
    roleTitle: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
          role: "founder",
          full_name: formData.fullName,
          school: formData.school,
          graduation_year: formData.graduationYear
            ? parseInt(formData.graduationYear)
            : null,
          role_title: formData.roleTitle,
        },
      },
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
            <div className="mb-4 text-2xl font-bold tracking-tight">
              catalyst<span className="text-primary">_</span>
            </div>
            <h1 className="text-sm font-medium uppercase tracking-[0.1em]">Create Founder Profile</h1>
            <p className="mt-1 text-xs text-muted-foreground tracking-wide">
              register to showcase your startup
            </p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="system-label">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Jane Smith"
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
                placeholder="jane@university.edu"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school" className="system-label">School</Label>
                <Input
                  id="school"
                  placeholder="MIT"
                  value={formData.school}
                  onChange={(e) => updateField("school", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduationYear" className="system-label">Grad Year</Label>
                <Input
                  id="graduationYear"
                  placeholder="2026"
                  value={formData.graduationYear}
                  onChange={(e) => updateField("graduationYear", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleTitle" className="system-label">Your Role</Label>
              <Input
                id="roleTitle"
                placeholder="CEO, CTO, etc."
                value={formData.roleTitle}
                onChange={(e) => updateField("roleTitle", e.target.value)}
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
            Are you an investor?{" "}
            <Link href="/signup/vc" className="text-primary/80 hover:text-primary transition-colors">
              Investor access
            </Link>
          </div>
        </div>

        <div className="mt-4 glow-line" />
      </div>
    </div>
  );
}
