import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Rocket, Building2, MessageSquare, Eye, FileText } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // Fetch counts
  const [
    { count: totalUsers },
    { count: founderCount },
    { count: vcCount },
    { count: startupCount },
    { count: updateCount },
    { count: acceleratorCount },
    { count: applicationCount },
    { count: conversationCount },
    { count: messageCount },
    { count: interactionCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "founder"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "vc"),
    supabase.from("startups").select("*", { count: "exact", head: true }),
    supabase.from("updates").select("*", { count: "exact", head: true }),
    supabase.from("accelerators").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("conversations").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("vc_interactions").select("*", { count: "exact", head: true }),
  ]);

  // Recent signups (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentSignups } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  // Top startups by momentum
  const { data: topStartups } = await supabase
    .from("startups")
    .select("name, momentum_score, school, stage")
    .order("momentum_score", { ascending: false })
    .limit(10);

  const stats = [
    { label: "Total Users", value: totalUsers || 0, icon: Users },
    { label: "Founders", value: founderCount || 0, icon: Users },
    { label: "VCs", value: vcCount || 0, icon: Building2 },
    { label: "Startups", value: startupCount || 0, icon: Rocket },
    { label: "Updates Posted", value: updateCount || 0, icon: FileText },
    { label: "Accelerators", value: acceleratorCount || 0, icon: Building2 },
    { label: "Applications", value: applicationCount || 0, icon: FileText },
    { label: "Conversations", value: conversationCount || 0, icon: MessageSquare },
    { label: "Messages Sent", value: messageCount || 0, icon: MessageSquare },
    { label: "VC Interactions", value: interactionCount || 0, icon: Eye },
    { label: "Signups (7d)", value: recentSignups || 0, icon: Users },
  ];

  return (
    <main className="mx-auto max-w-6xl px-8 py-8">
      <h1 className="mb-6 text-2xl font-bold">Platform Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <stat.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Startups by Momentum</CardTitle>
        </CardHeader>
        <CardContent>
          {topStartups && topStartups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">School</th>
                    <th className="pb-2 pr-4">Stage</th>
                    <th className="pb-2 text-right">Momentum</th>
                  </tr>
                </thead>
                <tbody>
                  {topStartups.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium">{s.name}</td>
                      <td className="py-2 pr-4">{s.school || "—"}</td>
                      <td className="py-2 pr-4 capitalize">{s.stage?.replace("_", " ") || "—"}</td>
                      <td className="py-2 text-right font-mono">
                        {Number(s.momentum_score) > 0
                          ? Number(s.momentum_score).toFixed(1)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No startups yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
