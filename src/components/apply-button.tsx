"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rocket } from "lucide-react";

interface ApplyButtonProps {
  acceleratorId: string;
  startups: { id: string; name: string }[];
}

export function ApplyButton({ acceleratorId, startups }: ApplyButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState(
    startups.length === 1 ? startups[0].id : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleApply() {
    if (!selectedStartup) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    // Check if already applied
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("accelerator_id", acceleratorId)
      .eq("startup_id", selectedStartup)
      .single();

    if (existing) {
      setError("You've already applied with this startup.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("applications")
      .insert({
        accelerator_id: acceleratorId,
        startup_id: selectedStartup,
        status: "submitted",
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (startups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Create a startup profile first to apply.
      </p>
    );
  }

  // 1-click apply for single startup
  if (startups.length === 1) {
    return (
      <Button size="sm" className="gap-1" onClick={handleApply} disabled={loading}>
        <Rocket className="h-4 w-4" />
        {loading ? "Applying..." : "Apply Now"}
      </Button>
    );
  }

  // Multiple startups — show picker
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 h-8"
      >
        <Rocket className="h-4 w-4" />
        Apply Now
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to Program</DialogTitle>
          <DialogDescription>
            Choose which startup to apply with.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select
            value={selectedStartup}
            onValueChange={(v) => v && setSelectedStartup(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a startup" />
            </SelectTrigger>
            <SelectContent>
              {startups.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button
              onClick={handleApply}
              disabled={loading || !selectedStartup}
            >
              {loading ? "Applying..." : "Submit Application"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
