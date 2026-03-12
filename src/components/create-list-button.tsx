"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function CreateListButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);

    const supabase = createClient();
    await supabase
      .from("bookmark_lists")
      .insert({ vc_user_id: userId, name: name.trim() });

    setLoading(false);
    setOpen(false);
    setName("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 h-7"
      >
        <Plus className="h-4 w-4" />
        New List
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="e.g., Top Picks Q1, Watchlist"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create List"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
