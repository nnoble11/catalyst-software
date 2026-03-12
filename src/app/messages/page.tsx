import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";
import { MessageSquare } from "lucide-react";

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // Get conversations the user is part of
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const convoIds = participations?.map((p) => p.conversation_id) || [];

  let conversations: {
    id: string;
    startup_id: string;
    startup_name: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
    other_user_name: string;
  }[] = [];

  if (convoIds.length > 0) {
    // Fetch conversations with startup info
    const { data: convos } = await supabase
      .from("conversations")
      .select("id, startup_id, updated_at")
      .in("id", convoIds)
      .order("updated_at", { ascending: false });

    for (const convo of convos || []) {
      // Get startup name
      const { data: startup } = await supabase
        .from("startups")
        .select("name")
        .eq("id", convo.startup_id)
        .single();

      // Get other participant
      const { data: otherParticipant } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", convo.id)
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

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Count unread
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", convo.id)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      conversations.push({
        id: convo.id,
        startup_id: convo.startup_id,
        startup_name: startup?.name || "Unknown Startup",
        last_message: lastMsg?.content || "",
        last_message_at: lastMsg?.created_at || convo.updated_at,
        unread_count: count || 0,
        other_user_name: otherName,
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-4 py-4 sm:px-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/dashboard" className="text-xl font-bold">
            catalyst <span className="text-primary">sonar</span>
          </Link>
          {profile?.role === "vc" && (
            <nav className="hidden gap-4 text-sm sm:flex">
              <Link
                href="/deals"
                className="text-muted-foreground hover:text-foreground"
              >
                Deal Table
              </Link>
              <Link
                href="/lists"
                className="text-muted-foreground hover:text-foreground"
              >
                Lists
              </Link>
              <Link href="/messages" className="font-medium">
                Messages
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {profile?.full_name}
          </span>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold">Messages</h1>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              {profile?.role === "vc"
                ? "Contact a founder from the deal table to start a conversation."
                : "When an investor reaches out, you'll see their messages here."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((convo) => (
              <Link key={convo.id} href={`/messages/${convo.id}`}>
                <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{convo.other_user_name}</p>
                        <span className="text-xs text-muted-foreground">
                          re: {convo.startup_name}
                        </span>
                        {convo.unread_count > 0 && (
                          <Badge className="text-xs">
                            {convo.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {convo.last_message}
                      </p>
                    </div>
                    <span className="ml-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(convo.last_message_at).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
