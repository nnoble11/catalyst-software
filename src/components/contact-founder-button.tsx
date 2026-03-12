"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Send } from "lucide-react";

interface ContactFounderButtonProps {
  startupId: string;
  founderId: string;
  vcUserId: string;
  startupName: string;
}

export function ContactFounderButton({
  startupId,
  founderId,
  vcUserId,
  startupName,
}: ContactFounderButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSend() {
    if (!message.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    // Check if conversation already exists between these users for this startup
    const { data: existingConvos } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", vcUserId);

    let conversationId: string | null = null;

    if (existingConvos && existingConvos.length > 0) {
      const convoIds = existingConvos.map((c) => c.conversation_id);

      // Check if the founder is also in any of these conversations for this startup
      const { data: sharedConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", founderId)
        .in("conversation_id", convoIds);

      if (sharedConvos && sharedConvos.length > 0) {
        // Check if any of these are for this startup
        const { data: matchingConvo } = await supabase
          .from("conversations")
          .select("id")
          .eq("startup_id", startupId)
          .in(
            "id",
            sharedConvos.map((c) => c.conversation_id)
          )
          .limit(1)
          .single();

        if (matchingConvo) {
          conversationId = matchingConvo.id;
        }
      }
    }

    // Create new conversation if none exists
    if (!conversationId) {
      const { data: newConvo, error: convoError } = await supabase
        .from("conversations")
        .insert({ startup_id: startupId })
        .select()
        .single();

      if (convoError) {
        setError(convoError.message);
        setLoading(false);
        return;
      }

      conversationId = newConvo.id;

      // Add both participants
      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: vcUserId },
        { conversation_id: conversationId, user_id: founderId },
      ]);
    }

    // Send the message
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: vcUserId,
      content: message.trim(),
    });

    if (msgError) {
      setError(msgError.message);
      setLoading(false);
      return;
    }

    // Log interaction
    await supabase.from("vc_interactions").insert({
      vc_user_id: vcUserId,
      startup_id: startupId,
      interaction_type: "message",
    });

    setLoading(false);
    setOpen(false);
    setMessage("");
    router.push(`/messages/${conversationId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 h-8"
      >
        <MessageSquare className="h-4 w-4" />
        Contact Founder
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {startupName}</DialogTitle>
          <DialogDescription>
            Send a message to the founders. They&apos;ll see it in their inbox.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Hi, I'd love to learn more about your startup..."
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="gap-1"
            >
              <Send className="h-4 w-4" />
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
