import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";
import { STAGE_LABELS, type StartupStage } from "@/lib/types";
import { Plus, Calendar, MapPin } from "lucide-react";

export default async function ManageAcceleratorsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: accelerators } = await supabase
    .from("accelerators")
    .select("*")
    .eq("vc_user_id", user.id)
    .order("created_at", { ascending: false });

  // Get application counts per accelerator
  const accIds = accelerators?.map((a) => a.id) || [];
  let appCounts: Record<string, number> = {};
  if (accIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("accelerator_id")
      .in("accelerator_id", accIds);

    for (const app of apps || []) {
      appCounts[app.accelerator_id] = (appCounts[app.accelerator_id] || 0) + 1;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold">Catalyst Labs</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/deals" className="text-muted-foreground hover:text-foreground">Deal Table</Link>
            <Link href="/lists" className="text-muted-foreground hover:text-foreground">Lists</Link>
            <Link href="/accelerator/manage" className="font-medium">Accelerators</Link>
            <Link href="/messages" className="text-muted-foreground hover:text-foreground">Messages</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Accelerator Programs</h1>
          <Link href="/accelerator/create">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              New Program
            </Button>
          </Link>
        </div>

        {!accelerators || accelerators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <h3 className="mb-2 font-semibold">No programs yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create an accelerator listing to start receiving 1-click applications from student startups.
              </p>
              <Link href="/accelerator/create">
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  Create Program
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {accelerators.map((acc) => (
              <Card key={acc.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{acc.name}</span>
                    <Badge variant={acc.is_active ? "default" : "outline"}>
                      {acc.is_active ? "Active" : "Closed"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {acc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {acc.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {acc.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {acc.location}
                      </span>
                    )}
                    {acc.application_deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline: {new Date(acc.application_deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {acc.funding_provided && (
                      <Badge variant="outline">{acc.funding_provided}</Badge>
                    )}
                    {acc.equity_taken && (
                      <Badge variant="outline">{acc.equity_taken} equity</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium">
                      {appCounts[acc.id] || 0} application{(appCounts[acc.id] || 0) !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-2">
                      <Link href={`/accelerator/${acc.id}/applications`}>
                        <Button variant="outline" size="sm">View Apps</Button>
                      </Link>
                      <Link href={`/accelerator/${acc.id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
