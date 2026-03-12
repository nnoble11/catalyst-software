"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
  messages: Message[];
}

export function MessageThread({
  conversationId,
  currentUserId,
  messages: initialMessages,
}: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          content: data.content,
          senderId: data.sender_id,
          createdAt: data.created_at,
        },
      ]);
      setNewMessage("");

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    setSending(false);
  }

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-4 py-2",
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        isMe
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="border-t px-8 py-4">
        <form
          onSubmit={handleSend}
          className="mx-auto flex max-w-3xl items-end gap-3"
        >
          <Textarea
            placeholder="Type a message..."
            rows={2}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            className="flex-1 resize-none"
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            size="sm"
            className="gap-1"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
