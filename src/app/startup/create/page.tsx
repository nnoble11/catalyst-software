"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INDUSTRY_OPTIONS, STAGE_LABELS, type StartupStage } from "@/lib/types";
import { ArrowLeft, ArrowRight, Check, X, Upload } from "lucide-react";
import { uploadStartupLogo } from "@/lib/upload-logo";

const STEPS = ["Basics", "Details", "Industries", "Review"];

export default function CreateStartupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    oneLiner: "",
    description: "",
    school: "",
    stage: "idea" as StartupStage,
    websiteUrl: "",
    location: "",
    foundingDate: "",
    teamSize: "1",
    fundingRaised: "0",
    industries: [] as string[],
  });

  function updateField(field: string, value: string | string[]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleIndustry(industry: string) {
    setFormData((prev) => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter((i) => i !== industry)
        : [...prev.industries, industry],
    }));
  }

  const [nameWarning, setNameWarning] = useState("");

  function canProceed(): boolean {
    if (step === 0) return formData.name.trim().length > 0;
    return true;
  }

  async function checkDuplicateName() {
    if (!formData.name.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("startups")
      .select("id")
      .ilike("name", formData.name.trim())
      .limit(1);
    if (data && data.length > 0) {
      setNameWarning("A startup with this name already exists. You may want to join it instead of creating a new one.");
    } else {
      setNameWarning("");
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to create a startup.");
      setLoading(false);
      return;
    }

    // Create the startup
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .insert({
        name: formData.name,
        one_liner: formData.oneLiner || null,
        description: formData.description || null,
        school: formData.school || null,
        stage: formData.stage,
        website_url: formData.websiteUrl || null,
        location: formData.location || null,
        founding_date: formData.foundingDate || null,
        team_size: parseInt(formData.teamSize) || 1,
        funding_raised: parseFloat(formData.fundingRaised) || 0,
        industries: formData.industries,
      })
      .select()
      .single();

    if (startupError) {
      setError(startupError.message);
      setLoading(false);
      return;
    }

    // Upload logo if provided
    if (logoFile) {
      try {
        const logoUrl = await uploadStartupLogo(supabase, logoFile, startup.id);
        await supabase
          .from("startups")
          .update({ logo_url: logoUrl })
          .eq("id", startup.id);
      } catch (uploadErr) {
        console.error("Logo upload failed:", uploadErr);
        // Non-blocking — startup is still created
      }
    }

    // Link founder to startup
    const { error: linkError } = await supabase
      .from("startup_founders")
      .insert({
        startup_id: startup.id,
        founder_id: user.id,
        role: "primary",
      });

    if (linkError) {
      setError(linkError.message);
      setLoading(false);
      return;
    }

    router.push(`/startup/${startup.id}`);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Startup</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </CardDescription>
          {/* Progress bar */}
          <div className="flex gap-1 pt-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          )}

          {/* Step 1: Basics */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Startup Name *</Label>
                <Input
                  id="name"
                  placeholder="Acme Labs"
                  value={formData.name}
                  onChange={(e) => { updateField("name", e.target.value); setNameWarning(""); }}
                  onBlur={checkDuplicateName}
                  required
                />
                {nameWarning && (
                  <p className="text-xs text-yellow-500">{nameWarning}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="oneLiner">One-Liner</Label>
                <Input
                  id="oneLiner"
                  placeholder="Building the future of X for Y"
                  maxLength={140}
                  value={formData.oneLiner}
                  onChange={(e) => updateField("oneLiner", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.oneLiner.length}/140 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us more about what you're building..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(v) => v && updateField("stage", v)}
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
                <Label>Logo (optional)</Label>
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border">
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="absolute -right-1 -top-1 rounded-full bg-background border border-border p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border border-dashed border-border hover:border-primary/30 transition-colors">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLogoFile(file);
                            setLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or SVG. Max 2MB.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    placeholder="MIT"
                    value={formData.school}
                    onChange={(e) => updateField("school", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website</Label>
                <Input
                  id="websiteUrl"
                  placeholder="https://acmelabs.com"
                  value={formData.websiteUrl}
                  onChange={(e) => updateField("websiteUrl", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="foundingDate">Founded</Label>
                  <Input
                    id="foundingDate"
                    type="date"
                    value={formData.foundingDate}
                    onChange={(e) =>
                      updateField("foundingDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    min="1"
                    value={formData.teamSize}
                    onChange={(e) => updateField("teamSize", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fundingRaised">Funding ($)</Label>
                  <Input
                    id="fundingRaised"
                    type="number"
                    min="0"
                    value={formData.fundingRaised}
                    onChange={(e) =>
                      updateField("fundingRaised", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Industries */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Select the industries that apply to your startup.
              </p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map((industry) => {
                  const selected = formData.industries.includes(industry);
                  return (
                    <Badge
                      key={industry}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() => toggleIndustry(industry)}
                    >
                      {selected && <Check className="mr-1 h-3 w-3" />}
                      {industry}
                    </Badge>
                  );
                })}
              </div>
              {formData.industries.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.industries.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 3 && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-semibold">{formData.name}</h3>
                {formData.oneLiner && (
                  <p className="text-sm text-muted-foreground">
                    {formData.oneLiner}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Stage:</span>{" "}
                  {STAGE_LABELS[formData.stage]}
                </div>
                {formData.school && (
                  <div>
                    <span className="text-muted-foreground">School:</span>{" "}
                    {formData.school}
                  </div>
                )}
                {formData.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    {formData.location}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Team:</span>{" "}
                  {formData.teamSize}
                </div>
                {Number(formData.fundingRaised) > 0 && (
                  <div>
                    <span className="text-muted-foreground">Funding:</span> $
                    {Number(formData.fundingRaised).toLocaleString()}
                  </div>
                )}
                {formData.websiteUrl && (
                  <div>
                    <span className="text-muted-foreground">Website:</span>{" "}
                    {formData.websiteUrl}
                  </div>
                )}
              </div>
              {formData.industries.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.industries.map((ind) => (
                    <Badge key={ind} variant="outline" className="text-xs">
                      {ind}
                    </Badge>
                  ))}
                </div>
              )}
              {formData.description && (
                <p className="text-sm">{formData.description}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="gap-1"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
              >
                {loading ? "Creating..." : "Create Startup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
