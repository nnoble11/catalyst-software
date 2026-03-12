import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { DealTable } from "@/components/deal-table";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default async function DealsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: startups } = await supabase
    .from("startups")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background system-grid-bg">
      <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-8" style={{ boxShadow: "0 1px 12px oklch(0.65 0.2 45 / 3%)" }}>
        <div className="flex items-center gap-4 sm:gap-6">
          <Logo />
          <nav className="hidden gap-4 text-xs sm:flex">
            <Link href="/deals" className="font-medium uppercase tracking-[0.1em] text-primary/80">
              Deal Table
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500/60" />
            <span className="text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground">
              {profile?.full_name}
            </span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
          <span className="system-label">data terminal</span>
        </div>
        <div className="mb-6">
          <h1 className="text-xl font-bold uppercase tracking-[0.05em]">Deal Flow</h1>
          <p className="text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mt-1">
            {startups?.length || 0} nodes indexed
          </p>
        </div>

        <DealTable startups={startups || []} />
      </main>
    </div>
  );
}
