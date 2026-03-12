import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp, Plus } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileNav } from "@/components/mobile-nav";
import { STAGE_LABELS, type StartupStage } from "@/lib/types";

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

  // Fetch founder's startups
  let startups: { id: string; name: string; one_liner: string | null; stage: string; momentum_score: number; industries: string[] }[] = [];
  if (profile?.role === "founder") {
    const { data: founderLinks } = await supabase
      .from("startup_founders")
      .select("startup_id")
      .eq("founder_id", user.id);

    if (founderLinks && founderLinks.length > 0) {
      const startupIds = founderLinks.map((l) => l.startup_id);
      const { data } = await supabase
        .from("startups")
        .select("id, name, one_liner, stage, momentum_score, industries")
        .in("id", startupIds);
      startups = data || [];
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative flex items-center justify-between border-b px-4 py-4 sm:px-8">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold">Catalyst Labs</div>
          <MobileNav
            links={
              profile?.role === "founder"
                ? [
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/accelerators", label: "Accelerators" },
                    { href: "/applications", label: "Applications" },
                    { href: "/messages", label: "Messages" },
                  ]
                : profile?.role === "vc"
                ? [
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/deals", label: "Deal Flow" },
                    { href: "/accelerator/manage", label: "Programs" },
                    { href: "/lists", label: "Lists" },
                    { href: "/messages", label: "Messages" },
                  ]
                : [
                    { href: "/admin/analytics", label: "Analytics" },
                    { href: "/admin/users", label: "Users" },
                    { href: "/admin/interactions", label: "Interactions" },
                    { href: "/admin/momentum", label: "Momentum" },
                  ]
            }
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {profile?.full_name || user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

        {profile?.role === "founder" && (
          <div className="space-y-6">
            {/* Startups list */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Startups</h2>
              <Link href="/startup/create">
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  New Startup
                </Button>
              </Link>
            </div>

            {startups.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {startups.map((startup) => (
                  <Link key={startup.id} href={`/startup/${startup.id}`}>
                    <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{startup.name}</span>
                          <Badge variant="outline">
                            {STAGE_LABELS[startup.stage as StartupStage]}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {startup.one_liner && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {startup.one_liner}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {startup.industries?.slice(0, 3).map((ind) => (
                              <Badge key={ind} variant="outline" className="text-xs">
                                {ind}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3" />
                            <span className="font-medium">
                              {startup.momentum_score > 0
                                ? startup.momentum_score.toFixed(0)
                                : "--"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Rocket className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold">No startups yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Create your first startup profile to get started.
                  </p>
                  <Link href="/startup/create">
                    <Button className="gap-1">
                      <Plus className="h-4 w-4" />
                      Create Startup Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick links */}
            <div className="flex gap-3">
              <Link href="/messages">
                <Button variant="outline" size="sm">Messages</Button>
              </Link>
            </div>

            {/* Accelerator Marketplace teaser */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accelerator Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Browse accelerator programs and apply with 1 click.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href="/accelerators">
                    <Button variant="outline" size="sm">
                      Browse Accelerators
                    </Button>
                  </Link>
                  <Link href="/applications">
                    <Button variant="outline" size="sm">
                      My Applications
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {profile?.role === "vc" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Deal Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Browse student startups and track your pipeline.
                </p>
                <Link href="/deals">
                  <Button className="mt-4">View Deal Table</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Accelerator Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  List your accelerator program and receive 1-click applications.
                </p>
                <Link href="/accelerator/manage">
                  <Button className="mt-4" variant="outline">
                    Manage Programs
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Saved Lists</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organize startups into custom lists.
                </p>
                <Link href="/lists">
                  <Button className="mt-4" variant="outline">
                    View Lists
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Chat with founders.
                </p>
                <Link href="/messages">
                  <Button className="mt-4" variant="outline">
                    View Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {profile?.role === "admin" && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/admin/analytics">
                  <Button>View Analytics</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/admin/users">
                  <Button>Manage Users</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Momentum Config</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/admin/momentum">
                  <Button>Configure</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
