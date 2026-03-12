import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";
import { STAGE_LABELS, type StartupStage } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default async function ApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "founder") redirect("/dashboard");

  // Get founder's startups
  const { data: links } = await supabase
    .from("startup_founders")
    .select("startup_id")
    .eq("founder_id", user.id);

  const startupIds = links?.map((l) => l.startup_id) || [];

  let applications: {
    id: string;
    status: string;
    created_at: string;
    startup_id: string;
    accelerator_id: string;
  }[] = [];

  if (startupIds.length > 0) {
    const { data } = await supabase
      .from("applications")
      .select("id, status, created_at, startup_id, accelerator_id")
      .in("startup_id", startupIds)
      .order("created_at", { ascending: false });
    applications = data || [];
  }

  // Fetch startup names
  const startupNameMap: Record<string, string> = {};
  if (startupIds.length > 0) {
    const { data: startups } = await supabase
      .from("startups")
      .select("id, name")
      .in("id", startupIds);
    for (const s of startups || []) {
      startupNameMap[s.id] = s.name;
    }
  }

  // Fetch accelerator names
  const accIds = [...new Set(applications.map((a) => a.accelerator_id))];
  const accNameMap: Record<string, string> = {};
  if (accIds.length > 0) {
    const { data: accs } = await supabase
      .from("accelerators")
      .select("id, name")
      .in("id", accIds);
    for (const a of accs || []) {
      accNameMap[a.id] = a.name;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold">Catalyst Labs</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">My Applications</h1>
            <p className="text-sm text-muted-foreground">
              {applications.length} application{applications.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4">No applications yet.</p>
            <Link href="/accelerators">
              <Button>Browse Accelerators</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">
                      {accNameMap[app.accelerator_id] || "Unknown Program"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applied with {startupNameMap[app.startup_id] || "Unknown Startup"} &middot;{" "}
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={`text-xs capitalize ${STATUS_COLORS[app.status] || ""}`}>
                    {app.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
