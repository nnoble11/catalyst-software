import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";
import { STAGE_LABELS, type StartupStage } from "@/lib/types";
import { Bookmark, Plus, TrendingUp } from "lucide-react";
import { CreateListButton } from "@/components/create-list-button";

export default async function ListsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Fetch bookmark lists with item counts
  const { data: lists } = await supabase
    .from("bookmark_lists")
    .select("id, name, created_at")
    .eq("vc_user_id", user.id)
    .order("created_at", { ascending: false });

  // For each list, get the startups
  const listsWithStartups = await Promise.all(
    (lists || []).map(async (list) => {
      const { data: items } = await supabase
        .from("bookmark_list_items")
        .select("startup_id")
        .eq("list_id", list.id);

      const startupIds = items?.map((i) => i.startup_id) || [];
      let startups: { id: string; name: string; stage: string; momentum_score: number }[] = [];

      if (startupIds.length > 0) {
        const { data } = await supabase
          .from("startups")
          .select("id, name, stage, momentum_score")
          .in("id", startupIds);
        startups = data || [];
      }

      return { ...list, startups };
    })
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Catalyst Labs
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/deals"
              className="text-muted-foreground hover:text-foreground"
            >
              Deal Table
            </Link>
            <Link href="/lists" className="font-medium">
              Lists
            </Link>
            <Link
              href="/messages"
              className="text-muted-foreground hover:text-foreground"
            >
              Messages
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {profile?.full_name}
          </span>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Lists</h1>
          <CreateListButton userId={user.id} />
        </div>

        {listsWithStartups.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bookmark className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">No lists yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Bookmark startups from the deal table or create a new list.
            </p>
            <CreateListButton userId={user.id} />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {listsWithStartups.map((list) => (
              <Card key={list.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{list.name}</span>
                    <Badge variant="outline">
                      {list.startups.length} startup{list.startups.length !== 1 && "s"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {list.startups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No startups in this list yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {list.startups.slice(0, 5).map((startup) => (
                        <Link
                          key={startup.id}
                          href={`/deals/${startup.id}`}
                          className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{startup.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {STAGE_LABELS[startup.stage as StartupStage]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            {startup.momentum_score > 0
                              ? startup.momentum_score.toFixed(0)
                              : "--"}
                          </div>
                        </Link>
                      ))}
                      {list.startups.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{list.startups.length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
