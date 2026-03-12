"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApplicationStatus } from "@/lib/types";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  accepted: "Accepted",
  rejected: "Rejected",
};

export function ApplicationStatusButton({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  async function handleChange(newStatus: string | null) {
    if (!newStatus || newStatus === status) return;
    setStatus(newStatus);

    const supabase = createClient();
    await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", applicationId);

    router.refresh();
  }

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
