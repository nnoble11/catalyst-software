import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS, type StartupStage } from "@/lib/types";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { ApplicationStatusButton } from "@/components/application-status-button";

export default async function AcceleratorApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: accelerator } = await supabase
    .from("accelerators")
    .select("name, vc_user_id")
    .eq("id", id)
    .single();

  if (!accelerator || accelerator.vc_user_id !== user.id) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, applied_at, startup_id")
    .eq("accelerator_id", id)
    .order("applied_at", { ascending: false });

  // Fetch startup details for each application
  const startupIds = applications?.map((a) => a.startup_id) || [];
  let startups: Record<string, { name: string; stage: string; school: string | null; momentum_score: number }> = {};
  if (startupIds.length > 0) {
    const { data } = await supabase
      .from("startups")
      .select("id, name, stage, school, momentum_score")
      .in("id", startupIds);
    for (const s of data || []) {
      startups[s.id] = s;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/accelerator/manage">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="font-bold">{accelerator.name}</h1>
            <p className="text-xs text-muted-foreground">Applications</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-8">
        <p className="mb-6 text-sm text-muted-foreground">
          {applications?.length || 0} application{(applications?.length || 0) !== 1 ? "s" : ""}
        </p>

        {!applications || applications.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No applications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const startup = startups[app.startup_id];
              return (
                <Card key={app.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <Link
                          href={`/deals/${app.startup_id}`}
                          className="font-medium hover:underline"
                        >
                          {startup?.name || "Unknown Startup"}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {startup?.school && (
                            <span className="text-xs text-muted-foreground">
                              {startup.school}
                            </span>
                          )}
                          {startup && (
                            <Badge variant="outline" className="text-xs">
                              {STAGE_LABELS[startup.stage as StartupStage]}
                            </Badge>
                          )}
                          {startup && startup.momentum_score > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              {startup.momentum_score.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                      <ApplicationStatusButton
                        applicationId={app.id}
                        currentStatus={app.status}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
