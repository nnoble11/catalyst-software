"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RecalculateButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const router = useRouter();

  async function handleRecalculate() {
    setLoading(true);
    setResult("");

    const res = await fetch("/api/momentum", { method: "POST" });
    const data = await res.json();

    if (res.ok) {
      setResult(`Updated ${data.updated} startups`);
      router.refresh();
    } else {
      setResult(data.error || "Failed to recalculate");
    }

    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
      <Button
        onClick={handleRecalculate}
        disabled={loading}
        size="sm"
        className="gap-1"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Recalculating..." : "Recalculate All"}
      </Button>
    </div>
  );
}
