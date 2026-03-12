import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { DealTable } from "@/components/deal-table";
import Link from "next/link";

export default async function DealsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all startups
  const { data: startups } = await supabase
    .from("startups")
    .select("*")
    .order("momentum_score", { ascending: false });

  // Fetch user's bookmark list items for quick reference
  const { data: bookmarkLists } = await supabase
    .from("bookmark_lists")
    .select("id, name")
    .eq("vc_user_id", user.id);

  const listIds = bookmarkLists?.map((l) => l.id) || [];
  let bookmarkedStartupIds: string[] = [];
  if (listIds.length > 0) {
    const { data: items } = await supabase
      .from("bookmark_list_items")
      .select("startup_id")
      .in("list_id", listIds);
    bookmarkedStartupIds = items?.map((i) => i.startup_id) || [];
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-4 py-4 sm:px-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Catalyst Labs
          </Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            <Link href="/deals" className="font-medium">
              Deal Table
            </Link>
            <Link
              href="/lists"
              className="text-muted-foreground hover:text-foreground"
            >
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
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {profile?.full_name}
          </span>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Deal Flow</h1>
          <p className="text-sm text-muted-foreground">
            {startups?.length || 0} startups on the platform
          </p>
        </div>

        <DealTable
          startups={startups || []}
          bookmarkedIds={bookmarkedStartupIds}
          userId={user.id}
        />
      </main>
    </div>
  );
}
