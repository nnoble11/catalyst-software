import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
  Users,
  FileText,
} from "lucide-react";

export default async function VCStartupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("id", id)
    .single();

  if (!startup) {
    notFound();
  }

  const { data: founderLinks } = await supabase
    .from("startup_founders")
    .select("founder_id, role")
    .eq("startup_id", id);

  const founderIds = founderLinks?.map((f) => f.founder_id) || [];
  let founders: { id: string; full_name: string; role_title?: string; linkedin_url?: string }[] = [];
  if (founderIds.length > 0) {
    const { data: founderProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, linkedin_url")
      .in("id", founderIds);

    const { data: founderDetails } = await supabase
      .from("founder_profiles")
      .select("id, role_title")
      .in("id", founderIds);

    founders = (founderProfiles || []).map((p) => ({
      ...p,
      linkedin_url: p.linkedin_url ?? undefined,
      role_title: founderDetails?.find((d) => d.id === p.id)?.role_title ?? undefined,
    }));
  }

  const { data: updates } = await supabase
    .from("updates")
    .select("*, author:profiles(full_name)")
    .eq("startup_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-background system-grid-bg">
      <header className="border-b border-border px-8 py-4" style={{ boxShadow: "0 1px 12px oklch(0.65 0.2 45 / 3%)" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link href="/deals">
            <button className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Index
            </button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                <span className="system-label">startup profile</span>
              </div>
              <div className="flex items-center gap-3">
                {startup.logo_url ? (
                  <img
                    src={startup.logo_url}
                    alt={startup.name}
                    className="h-10 w-10 rounded-md object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-sm font-bold text-muted-foreground uppercase">
                    {startup.name.charAt(0)}
                  </div>
                )}
                <h1 className="text-2xl font-bold">{startup.name}</h1>
              </div>
              {startup.one_liner && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {startup.one_liner}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="text-[0.6rem] uppercase tracking-wider">{STAGE_LABELS[startup.stage as StartupStage]}</Badge>
                {startup.industries?.map((ind: string) => (
                  <Badge key={ind} variant="outline" className="text-[0.6rem]">
                    {ind}
                  </Badge>
                ))}
              </div>
            </div>

            {startup.description && (
              <div>
                <h2 className="system-label text-xs mb-2">About</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {startup.description}
                </p>
              </div>
            )}

            {startup.pitch_deck_url && (
              <div>
                <a
                  href={startup.pitch_deck_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="flex items-center gap-2 border border-border bg-transparent px-4 py-2 text-[0.65rem] uppercase tracking-[0.1em] text-foreground/70 transition-all hover:border-primary/30 hover:text-primary">
                    <FileText className="h-3.5 w-3.5" />
                    View Pitch Deck
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </a>
              </div>
            )}

            <Separator className="opacity-30" />

            {/* Updates as system log entries */}
            <div>
              <h2 className="system-label text-xs mb-4">Activity Log</h2>
              {updates && updates.length > 0 ? (
                <div className="space-y-3">
                  {updates.map((update) => (
                    <div key={update.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[0.55rem] uppercase tracking-wider">
                          {UPDATE_TYPE_LABELS[update.update_type as UpdateType]}
                        </Badge>
                        <span className="text-[0.6rem] text-muted-foreground">
                          {update.author?.full_name} &middot;{" "}
                          {new Date(update.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs whitespace-pre-wrap text-foreground/80">
                        {update.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                  No activity logged
                </p>
              )}
            </div>
          </div>

          {/* Sidebar system modules */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-5 system-glow">
              <h3 className="system-label text-xs mb-4">Details</h3>
              <div className="space-y-3 text-xs">
                {startup.school && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    {startup.school}
                  </div>
                )}
                {startup.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {startup.location}
                  </div>
                )}
                {startup.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <a
                      href={startup.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary/80 hover:text-primary transition-colors"
                    >
                      Website
                      <ExternalLink className="ml-1 inline h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {startup.team_size} team member{startup.team_size !== 1 && "s"}
                </div>
                {startup.founding_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Founded{" "}
                    {new Date(startup.founding_date).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" }
                    )}
                  </div>
                )}
                {Number(startup.funding_raised) > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    {Number(startup.funding_raised).toLocaleString()} raised
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 system-glow">
              <h3 className="system-label text-xs mb-4">Team</h3>
              <div className="space-y-3">
                {founders.map((founder) => (
                  <div key={founder.id} className="text-xs">
                    <p className="font-medium">{founder.full_name}</p>
                    {founder.role_title && (
                      <p className="text-[0.65rem] text-muted-foreground">
                        {founder.role_title}
                      </p>
                    )}
                    {founder.linkedin_url && (
                      <a
                        href={founder.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.65rem] text-primary/80 hover:text-primary transition-colors"
                      >
                        LinkedIn
                        <ExternalLink className="ml-1 inline h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
