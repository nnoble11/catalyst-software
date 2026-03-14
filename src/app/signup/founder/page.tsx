"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { INDUSTRY_OPTIONS, SUPPORT_OPTIONS, STAGE_LABELS, type StartupStage } from "@/lib/types";
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FounderSignupPage() {
  return (
    <Suspense>
      <FounderSignupInner />
    </Suspense>
  );
}

function FounderSignupInner() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code") || "";
  const codeId = searchParams.get("codeId") || "";
  const router = useRouter();

  const [phase, setPhase] = useState<"account" | "startup">("account");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    school: "",
    graduationYear: "",
    roleTitle: "",
    linkedinUrl: "",
  });

  const [startupData, setStartupData] = useState({
    name: "",
    oneLiner: "",
    stage: "idea" as StartupStage,
    industries: [] as string[],
    monthlyRevenue: "",
    userCount: "",
    supportNeeded: [] as string[],
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Redirect back if no code provided
  useEffect(() => {
    if (!inviteCode || !codeId) {
      router.replace("/invite/founder");
    }
  }, [inviteCode, codeId, router]);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateStartupField(field: string, value: string | string[]) {
    setStartupData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleIndustry(industry: string) {
    setStartupData((prev) => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter((i) => i !== industry)
        : [...prev.industries, industry],
    }));
  }

  function toggleSupport(option: string) {
    setStartupData((prev) => ({
      ...prev,
      supportNeeded: prev.supportNeeded.includes(option)
        ? prev.supportNeeded.filter((s) => s !== option)
        : [...prev.supportNeeded, option],
    }));
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
      setUserId(authData.user.id);
      await fetch("/api/redeem-invite-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId, userId: authData.user.id }),
      });
    }

    setLoading(false);
    setPhase("startup");
  }

  async function handleStartupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!currentUserId) {
      setError("Session lost. Please try logging in.");
      setLoading(false);
      return;
    }

    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .insert({
        name: startupData.name,
        one_liner: startupData.oneLiner || null,
        stage: startupData.stage,
        industries: startupData.industries,
        monthly_revenue: startupData.monthlyRevenue
          ? parseFloat(startupData.monthlyRevenue)
          : 0,
        user_count: startupData.userCount
          ? parseInt(startupData.userCount)
          : 0,
        support_needed: startupData.supportNeeded,
      })
      .select()
      .single();

    if (startupError) {
      setError(startupError.message);
      setLoading(false);
      return;
    }

    // Link founder to startup
    await supabase.from("startup_founders").insert({
      startup_id: startup.id,
      founder_id: currentUserId,
      role: "primary",
    });

    router.push("/dashboard");
    router.refresh();
  }

  if (!inviteCode || !codeId) return null;

  // ──── PHASE 2: Basic Startup Info ────
  if (phase === "startup") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 system-grid-bg">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
            <span className="system-label">startup registration</span>
          </div>

          <div className="rounded-lg border border-border bg-card p-8 system-glow">
            <div className="mb-6 text-center">
              <h1 className="text-sm font-medium uppercase tracking-[0.1em]">
                Add Your Startup
              </h1>
              <p className="mt-1 text-xs text-muted-foreground tracking-wide">
                you can add more details later
              </p>
            </div>

            <form onSubmit={handleStartupSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="startupName" className="system-label">
                  Startup Name *
                </Label>
                <Input
                  id="startupName"
                  placeholder="Acme Labs"
                  value={startupData.name}
                  onChange={(e) => updateStartupField("name", e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oneLiner" className="system-label">
                  One-Liner
                </Label>
                <Input
                  id="oneLiner"
                  placeholder="Building the future of X for Y"
                  maxLength={140}
                  value={startupData.oneLiner}
                  onChange={(e) => updateStartupField("oneLiner", e.target.value)}
                />
                <p className="text-[0.6rem] text-muted-foreground">
                  {startupData.oneLiner.length}/140
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage" className="system-label">
                  Stage
                </Label>
                <Select
                  value={startupData.stage}
                  onValueChange={(v) => v && updateStartupField("stage", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="system-label">Industries</Label>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRY_OPTIONS.map((industry) => {
                    const selected = startupData.industries.includes(industry);
                    return (
                      <Badge
                        key={industry}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none text-[0.6rem]"
                        onClick={() => toggleIndustry(industry)}
                      >
                        {selected && <Check className="mr-0.5 h-2.5 w-2.5" />}
                        {industry}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="system-label">
                  Do you have any revenue or users yet?
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="monthlyRevenue" className="text-[0.6rem] text-muted-foreground">
                      Monthly Revenue ($)
                    </Label>
                    <Input
                      id="monthlyRevenue"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={startupData.monthlyRevenue}
                      onChange={(e) => updateStartupField("monthlyRevenue", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="userCount" className="text-[0.6rem] text-muted-foreground">
                      Number of Users
                    </Label>
                    <Input
                      id="userCount"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={startupData.userCount}
                      onChange={(e) => updateStartupField("userCount", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="system-label">
                  What kind of support are you looking for beyond capital?
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPORT_OPTIONS.map((option) => {
                    const selected = startupData.supportNeeded.includes(option);
                    return (
                      <Badge
                        key={option}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none text-[0.6rem]"
                        onClick={() => toggleSupport(option)}
                      >
                        {selected && <Check className="mr-0.5 h-2.5 w-2.5" />}
                        {option}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading || !startupData.name.trim()}
                className="mt-2 w-full border border-primary/30 bg-transparent px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_20px_oklch(0.65_0.2_45/10%)] disabled:opacity-50"
              >
                {loading ? "Creating startup..." : "[ Create Startup ]"}
              </button>

            </form>
          </div>

          <div className="mt-4 glow-line" />
        </div>
      </div>
    );
  }

  // ──── PHASE 1: Account Creation ────
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
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="system-label">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/janesmith"
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
              {loading ? "Creating profile..." : "[ Continue ]"}
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
            <Link href="/invite/vc" className="text-primary/80 hover:text-primary transition-colors">
              Investor access
            </Link>
          </div>
        </div>

        <div className="mt-4 glow-line" />
      </div>
    </div>
  );
}
