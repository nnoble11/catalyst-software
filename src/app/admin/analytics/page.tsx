import { createClient } from "@/lib/supabase/server";
import { Users, Rocket, Building2, FileText } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: founderCount },
    { count: vcCount },
    { count: startupCount },
    { count: updateCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "founder"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "vc"),
    supabase.from("startups").select("*", { count: "exact", head: true }),
    supabase.from("updates").select("*", { count: "exact", head: true }),
  ]);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentSignups } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  const stats = [
    { label: "Total Users", value: totalUsers || 0, icon: Users },
    { label: "Founders", value: founderCount || 0, icon: Users },
    { label: "VCs", value: vcCount || 0, icon: Building2 },
    { label: "Startups", value: startupCount || 0, icon: Rocket },
    { label: "Updates Posted", value: updateCount || 0, icon: FileText },
    { label: "Signups (7d)", value: recentSignups || 0, icon: Users },
  ];

  return (
    <main className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
        <span className="system-label">analytics module</span>
      </div>
      <h1 className="mb-6 text-xl font-bold uppercase tracking-[0.05em]">Platform Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-5 system-glow-hover transition-all">
            <div className="flex items-center gap-3">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="system-label">{stat.label}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
