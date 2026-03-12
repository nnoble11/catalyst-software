import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";
import { STAGE_LABELS, type StartupStage } from "@/lib/types";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { ApplyButton } from "@/components/apply-button";

export default async function AcceleratorsPage() {
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

  // Fetch active accelerators
  const { data: accelerators } = await supabase
    .from("accelerators")
    .select("*")
    .eq("is_active", true)
    .order("application_deadline", { ascending: true });

  // Fetch VC profiles for firm names
  const vcIds = [...new Set(accelerators?.map((a) => a.vc_user_id) || [])];
  let vcNames: Record<string, string> = {};
  if (vcIds.length > 0) {
    const { data: vcProfiles } = await supabase
      .from("vc_profiles")
      .select("id, firm_name")
      .in("id", vcIds);
    for (const vc of vcProfiles || []) {
      vcNames[vc.id] = vc.firm_name;
    }
  }

  // Fetch founder's startups for the apply button
  let founderStartups: { id: string; name: string }[] = [];
  if (profile?.role === "founder") {
    const { data: links } = await supabase
      .from("startup_founders")
      .select("startup_id")
      .eq("founder_id", user.id);

    if (links && links.length > 0) {
      const { data } = await supabase
        .from("startups")
        .select("id, name")
        .in("id", links.map((l) => l.startup_id));
      founderStartups = data || [];
    }
  }

  // Fetch existing applications
  const startupIds = founderStartups.map((s) => s.id);
  let appliedMap: Record<string, string> = {}; // accelerator_id -> status
  if (startupIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("accelerator_id, status, startup_id")
      .in("startup_id", startupIds);
    for (const app of apps || []) {
      appliedMap[app.accelerator_id] = app.status;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-4 py-4 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">catalyst <span className="text-primary">sonar</span></Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden text-sm text-muted-foreground sm:inline">{profile?.full_name}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Accelerator Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            {accelerators?.length || 0} active program{(accelerators?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>

        {!accelerators || accelerators.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No active accelerator programs right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {accelerators.map((acc) => {
              const isApplied = acc.id in appliedMap;
              const isPastDeadline = acc.application_deadline && new Date(acc.application_deadline) < new Date();

              return (
                <Card key={acc.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{acc.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          by {vcNames[acc.vc_user_id] || "Unknown Firm"}
                        </p>
                      </div>
                      {isPastDeadline && !isApplied && (
                        <Badge variant="outline" className="text-xs">Deadline Passed</Badge>
                      )}
                      {isApplied && (
                        <Badge className="text-xs capitalize">{appliedMap[acc.id]}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {acc.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {acc.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {acc.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{acc.location}
                        </span>
                      )}
                      {acc.application_deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deadline: {new Date(acc.application_deadline).toLocaleDateString()}
                        </span>
                      )}
                      {acc.program_duration && (
                        <span>{acc.program_duration}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {acc.funding_provided && (
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {acc.funding_provided}
                        </Badge>
                      )}
                      {acc.equity_taken && (
                        <Badge variant="outline" className="text-xs">{acc.equity_taken} equity</Badge>
                      )}
                    </div>

                    {acc.stages_accepted && acc.stages_accepted.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {acc.stages_accepted.map((stage: string) => (
                          <Badge key={stage} variant="outline" className="text-xs">
                            {STAGE_LABELS[stage as StartupStage] || stage}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {profile?.role === "founder" && !isApplied && !isPastDeadline && (
                      <div className="pt-2">
                        <ApplyButton
                          acceleratorId={acc.id}
                          startups={founderStartups}
                        />
                      </div>
                    )}
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
