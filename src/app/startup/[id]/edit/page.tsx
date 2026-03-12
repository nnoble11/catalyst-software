"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INDUSTRY_OPTIONS, STAGE_LABELS, type StartupStage } from "@/lib/types";
import { ArrowLeft, Check, Save } from "lucide-react";
import Link from "next/link";

export default function EditStartupPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    async function loadStartup() {
      const supabase = createClient();
      const { data } = await supabase
        .from("startups")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setFormData({
          name: data.name || "",
          oneLiner: data.one_liner || "",
          description: data.description || "",
          school: data.school || "",
          stage: data.stage || "idea",
          websiteUrl: data.website_url || "",
          location: data.location || "",
          foundingDate: data.founding_date || "",
          teamSize: String(data.team_size || 1),
          fundingRaised: String(data.funding_raised || 0),
          industries: data.industries || [],
        });
      }
      setLoading(false);
    }
    loadStartup();
  }, [id]);

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

  async function handleSave() {
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("startups")
      .update({
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
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push(`/startup/${id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href={`/startup/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Startup</h1>
        </div>

        {error && (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oneLiner">One-Liner</Label>
                <Input
                  id="oneLiner"
                  maxLength={140}
                  value={formData.oneLiner}
                  onChange={(e) => updateField("oneLiner", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School</Label>
                  <Input
                    value={formData.school}
                    onChange={(e) => updateField("school", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={formData.websiteUrl}
                  onChange={(e) => updateField("websiteUrl", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Founded</Label>
                  <Input
                    type="date"
                    value={formData.foundingDate}
                    onChange={(e) => updateField("foundingDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Team Size</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.teamSize}
                    onChange={(e) => updateField("teamSize", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Funding ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.fundingRaised}
                    onChange={(e) => updateField("fundingRaised", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Industries</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-1">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
