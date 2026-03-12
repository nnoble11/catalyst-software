"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { UPDATE_TYPE_LABELS, type UpdateType } from "@/lib/types";
import { Send } from "lucide-react";

export function CreateUpdateForm({ startupId }: { startupId: string }) {
  const [content, setContent] = useState("");
  const [updateType, setUpdateType] = useState<UpdateType>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("updates").insert({
      startup_id: startupId,
      author_id: user.id,
      content: content.trim(),
      update_type: updateType,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setContent("");
    setUpdateType("general");
    setLoading(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Share an update about your startup..."
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <Select
              value={updateType}
              onValueChange={(v) => setUpdateType(v as UpdateType)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(UPDATE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !content.trim()}
              className="gap-1"
            >
              <Send className="h-3 w-3" />
              {loading ? "Posting..." : "Post Update"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
