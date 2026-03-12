import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileNav } from "@/components/mobile-nav";
import { STAGE_LABELS, type StartupStage } from "@/lib/types";
import { Logo } from "@/components/logo";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  let startups: { id: string; name: string; one_liner: string | null; stage: string; industries: string[] }[] = [];
  if (profile?.role === "founder") {
    const { data: founderLinks } = await supabase
      .from("startup_founders")
      .select("startup_id")
      .eq("founder_id", user.id);

    if (founderLinks && founderLinks.length > 0) {
      const startupIds = founderLinks.map((l) => l.startup_id);
      const { data } = await supabase
        .from("startups")
        .select("id, name, one_liner, stage, industries")
        .in("id", startupIds);
      startups = data || [];
    }
  }

  return (
    <div className="min-h-screen bg-background system-grid-bg">
      {/* System toolbar header */}
      <header className="relative flex items-center justify-between border-b border-border px-4 py-4 sm:px-8" style={{ boxShadow: "0 1px 12px oklch(0.65 0.2 45 / 3%)" }}>
        <div className="flex items-center gap-4">
          <Logo />
          <MobileNav
            links={
              profile?.role === "founder"
                ? [{ href: "/dashboard", label: "Dashboard" }]
                : profile?.role === "vc"
                ? [
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/deals", label: "Deal Flow" },
                  ]
                : [
                    { href: "/admin/analytics", label: "Analytics" },
                    { href: "/admin/users", label: "Users" },
                  ]
            }
          />
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500/60" />
            <span className="text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground">
              {profile?.full_name || user.email}
            </span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
          <span className="system-label">control panel</span>
        </div>
        <h1 className="mb-8 text-2xl font-bold uppercase tracking-[0.05em]">Dashboard</h1>

        {profile?.role === "founder" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="system-label text-sm">Your Startups</h2>
              <Link href="/startup/create">
                <button className="flex items-center gap-1.5 border border-primary/30 bg-transparent px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5">
                  <Plus className="h-3 w-3" />
                  New Startup
                </button>
              </Link>
            </div>

            {startups.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {startups.map((startup) => (
                  <Link key={startup.id} href={`/startup/${startup.id}`}>
                    <div className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/15 system-glow-hover cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{startup.name}</span>
                        <Badge variant="outline" className="text-[0.6rem] uppercase tracking-wider">
                          {STAGE_LABELS[startup.stage as StartupStage]}
                        </Badge>
                      </div>
                      {startup.one_liner && (
                        <p className="text-xs text-muted-foreground mb-3">
                          {startup.one_liner}
                        </p>
                      )}
                      <div className="flex gap-1">
                        {startup.industries?.slice(0, 3).map((ind) => (
                          <Badge key={ind} variant="outline" className="text-[0.6rem]">
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-12 text-center system-glow">
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-4">
                  No startups registered
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  Create your first startup profile to get started.
                </p>
                <Link href="/startup/create">
                  <button className="inline-flex items-center gap-1.5 border border-primary/30 bg-transparent px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5">
                    <Plus className="h-3 w-3" />
                    Create Startup Profile
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {profile?.role === "vc" && (
          <div className="rounded-lg border border-border bg-card p-8 system-glow">
            <h2 className="system-label text-sm mb-3">Deal Flow</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Browse student startups and discover your next investment.
            </p>
            <Link href="/deals">
              <button className="border border-primary/30 bg-transparent px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_20px_oklch(0.65_0.2_45/10%)]">
                Enter Deal Flow →
              </button>
            </Link>
          </div>
        )}

        {profile?.role === "admin" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-8 system-glow-hover transition-all">
              <h2 className="system-label text-sm mb-3">Analytics Module</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Platform metrics and insights.
              </p>
              <Link href="/admin/analytics">
                <button className="border border-primary/30 bg-transparent px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5">
                  View Analytics →
                </button>
              </Link>
            </div>
            <div className="rounded-lg border border-border bg-card p-8 system-glow-hover transition-all">
              <h2 className="system-label text-sm mb-3">User Registry</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Manage platform users and roles.
              </p>
              <Link href="/admin/users">
                <button className="border border-primary/30 bg-transparent px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5">
                  Manage Users →
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
