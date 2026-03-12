import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  STAGE_LABELS,
  UPDATE_TYPE_LABELS,
  type StartupStage,
  type UpdateType,
} from "@/lib/types";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Globe,
  GraduationCap,
  MapPin,
  TrendingUp,
  Users,
} from "lucide-react";
import { CreateUpdateForm } from "@/components/create-update-form";

export default async function StartupProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch startup
  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("id", id)
    .single();

  if (!startup) {
    notFound();
  }

  // Fetch founders
  const { data: founderLinks } = await supabase
    .from("startup_founders")
    .select("founder_id, role")
    .eq("startup_id", id);

  const founderIds = founderLinks?.map((f) => f.founder_id) || [];

  let founders: { id: string; full_name: string; role_title?: string }[] = [];
  if (founderIds.length > 0) {
    const { data: founderProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", founderIds);

    const { data: founderDetails } = await supabase
      .from("founder_profiles")
      .select("id, role_title")
      .in("id", founderIds);

    founders = (founderProfiles || []).map((p) => ({
      ...p,
      role_title: founderDetails?.find((d) => d.id === p.id)?.role_title ?? undefined,
    }));
  }

  // Check if current user is a founder of this startup
  const isFounder = founderIds.includes(user?.id || "");

  // Fetch updates
  const { data: updates } = await supabase
    .from("updates")
    .select("*, author:profiles(full_name)")
    .eq("startup_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="text-xl font-bold">Catalyst Labs</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column — Startup info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Startup header */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{startup.name}</h1>
                  {startup.one_liner && (
                    <p className="mt-1 text-lg text-muted-foreground">
                      {startup.one_liner}
                    </p>
                  )}
                </div>
                {isFounder && (
                  <Link href={`/startup/${id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{STAGE_LABELS[startup.stage as StartupStage]}</Badge>
                {startup.industries?.map((ind: string) => (
                  <Badge key={ind} variant="outline">
                    {ind}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            {startup.description && (
              <div>
                <h2 className="mb-2 font-semibold">About</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {startup.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Updates feed */}
            <div>
              <h2 className="mb-4 font-semibold text-lg">Updates</h2>

              {isFounder && <CreateUpdateForm startupId={id} />}

              {updates && updates.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {updates.map((update) => (
                    <Card key={update.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {UPDATE_TYPE_LABELS[update.update_type as UpdateType]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {update.author?.full_name} &middot;{" "}
                            {new Date(update.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {update.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-4">
                  No updates yet.
                </p>
              )}
            </div>
          </div>

          {/* Right column — Sidebar */}
          <div className="space-y-6">
            {/* Momentum */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Momentum Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {startup.momentum_score > 0
                    ? startup.momentum_score.toFixed(0)
                    : "--"}
                </p>
                <p className="text-xs text-muted-foreground">out of 100</p>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {startup.school && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    {startup.school}
                  </div>
                )}
                {startup.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {startup.location}
                  </div>
                )}
                {startup.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={startup.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website
                      <ExternalLink className="ml-1 inline h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {startup.team_size} team member{startup.team_size !== 1 && "s"}
                </div>
                {startup.founding_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Founded{" "}
                    {new Date(startup.founding_date).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" }
                    )}
                  </div>
                )}
                {startup.funding_raised > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    {Number(startup.funding_raised).toLocaleString()} raised
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {founders.map((founder) => (
                  <div key={founder.id} className="text-sm">
                    <p className="font-medium">{founder.full_name}</p>
                    {founder.role_title && (
                      <p className="text-xs text-muted-foreground">
                        {founder.role_title}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
