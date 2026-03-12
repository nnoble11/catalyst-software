import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MessageThread } from "@/components/message-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user is a participant
  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .single();

  if (!participation) {
    notFound();
  }

  // Get conversation with startup info
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, startup_id")
    .eq("id", id)
    .single();

  if (!conversation) {
    notFound();
  }

  const { data: startup } = await supabase
    .from("startups")
    .select("name")
    .eq("id", conversation.startup_id)
    .single();

  // Get other participant
  const { data: otherParticipant } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", id)
    .neq("user_id", user.id)
    .single();

  let otherName = "Unknown";
  if (otherParticipant) {
    const { data: otherProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", otherParticipant.user_id)
      .single();
    otherName = otherProfile?.full_name || "Unknown";
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, sender_id, is_read, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  // Mark unread messages as read
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", id)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b px-8 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link href="/messages">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <p className="font-medium">{otherName}</p>
            <p className="text-xs text-muted-foreground">
              re: {startup?.name || "Unknown Startup"}
            </p>
          </div>
        </div>
      </header>

      <MessageThread
        conversationId={id}
        currentUserId={user.id}
        messages={
          messages?.map((m) => ({
            id: m.id,
            content: m.content,
            senderId: m.sender_id,
            createdAt: m.created_at,
          })) || []
        }
      />
    </div>
  );
}
