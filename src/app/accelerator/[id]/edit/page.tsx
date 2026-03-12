"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STAGE_LABELS, INDUSTRY_OPTIONS } from "@/lib/types";
import { ArrowLeft, Check, Save } from "lucide-react";

export default function EditAcceleratorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    applicationDeadline: "",
    programStartDate: "",
    programDuration: "",
    equityTaken: "",
    fundingProvided: "",
    industries: [] as string[],
    stagesAccepted: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("accelerators")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setFormData({
          name: data.name || "",
          description: data.description || "",
          location: data.location || "",
          applicationDeadline: data.application_deadline?.split("T")[0] || "",
          programStartDate: data.program_start_date?.split("T")[0] || "",
          programDuration: data.program_duration || "",
          equityTaken: data.equity_taken || "",
          fundingProvided: data.funding_provided || "",
          industries: data.industries || [],
          stagesAccepted: data.stages_accepted || [],
          isActive: data.is_active ?? true,
        });
      }
      setFetching(false);
    }
    load();
  }, [id]);

  function updateField(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleIndustry(ind: string) {
    setFormData((prev) => ({
      ...prev,
      industries: prev.industries.includes(ind)
        ? prev.industries.filter((i) => i !== ind)
        : [...prev.industries, ind],
    }));
  }

  function toggleStage(stage: string) {
    setFormData((prev) => ({
      ...prev,
      stagesAccepted: prev.stagesAccepted.includes(stage)
        ? prev.stagesAccepted.filter((s) => s !== stage)
        : [...prev.stagesAccepted, stage],
    }));
  }

  async function handleSubmit() {
    if (!formData.name.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("accelerators")
      .update({
        name: formData.name,
        description: formData.description || null,
        location: formData.location || null,
        application_deadline: formData.applicationDeadline || null,
        program_start_date: formData.programStartDate || null,
        program_duration: formData.programDuration || null,
        equity_taken: formData.equityTaken || null,
        funding_provided: formData.fundingProvided || null,
        industries: formData.industries,
        stages_accepted: formData.stagesAccepted,
        is_active: formData.isActive,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/accelerator/manage");
    router.refresh();
  }

  if (fetching) {
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
          <Link href="/accelerator/manage">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Accelerator Program</h1>
        </div>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Program Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Program Name *</Label>
                <Input
                  placeholder="e.g., TechStars Boston 2026"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe your program..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Program Duration</Label>
                  <Input
                    placeholder="e.g., 3 months"
                    value={formData.programDuration}
                    onChange={(e) => updateField("programDuration", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Application Deadline</Label>
                  <Input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => updateField("applicationDeadline", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Program Start Date</Label>
                  <Input
                    type="date"
                    value={formData.programStartDate}
                    onChange={(e) => updateField("programStartDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => updateField("isActive", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Program is active (visible to founders)</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Terms</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Funding Provided</Label>
                  <Input
                    placeholder="e.g., $125k"
                    value={formData.fundingProvided}
                    onChange={(e) => updateField("fundingProvided", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Equity Taken</Label>
                  <Input
                    placeholder="e.g., 5-7%"
                    value={formData.equityTaken}
                    onChange={(e) => updateField("equityTaken", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Target Startups</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Stages Accepted</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STAGE_LABELS).map(([value, label]) => {
                    const selected = formData.stagesAccepted.includes(value);
                    return (
                      <Badge
                        key={value}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => toggleStage(value)}
                      >
                        {selected && <Check className="mr-1 h-3 w-3" />}
                        {label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Industries</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((ind) => {
                    const selected = formData.industries.includes(ind);
                    return (
                      <Badge
                        key={ind}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => toggleIndustry(ind)}
                      >
                        {selected && <Check className="mr-1 h-3 w-3" />}
                        {ind}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim()}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
