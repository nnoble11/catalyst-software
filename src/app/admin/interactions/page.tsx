import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminInteractionsPage() {
  const supabase = await createClient();

  // Fetch recent interactions
  const { data: interactions } = await supabase
    .from("vc_interactions")
    .select("id, vc_user_id, startup_id, interaction_type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  // Gather unique IDs
  const vcIds = [...new Set(interactions?.map((i) => i.vc_user_id) || [])];
  const startupIds = [...new Set(interactions?.map((i) => i.startup_id) || [])];

  // Fetch VC names
  const vcNameMap: Record<string, string> = {};
  if (vcIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", vcIds);
    for (const p of profiles || []) {
      vcNameMap[p.id] = p.full_name;
    }
  }

  // Fetch VC firm names
  const firmMap: Record<string, string> = {};
  if (vcIds.length > 0) {
    const { data: vcProfiles } = await supabase
      .from("vc_profiles")
      .select("id, firm_name")
      .in("id", vcIds);
    for (const vp of vcProfiles || []) {
      firmMap[vp.id] = vp.firm_name;
    }
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

  // Aggregate: most viewed startups
  const viewCounts: Record<string, number> = {};
  for (const i of interactions || []) {
    if (i.interaction_type === "view") {
      viewCounts[i.startup_id] = (viewCounts[i.startup_id] || 0) + 1;
    }
  }
  const topViewed = Object.entries(viewCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Aggregate: most active VCs
  const vcActivity: Record<string, number> = {};
  for (const i of interactions || []) {
    vcActivity[i.vc_user_id] = (vcActivity[i.vc_user_id] || 0) + 1;
  }
  const topVCs = Object.entries(vcActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const typeBadge: Record<string, string> = {
    view: "bg-blue-100 text-blue-800",
    bookmark: "bg-yellow-100 text-yellow-800",
    message: "bg-green-100 text-green-800",
  };

  return (
    <main className="mx-auto max-w-6xl px-8 py-8">
      <h1 className="mb-6 text-2xl font-bold">VC Interaction Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Viewed Startups</CardTitle>
          </CardHeader>
          <CardContent>
            {topViewed.length > 0 ? (
              <div className="space-y-2">
                {topViewed.map(([startupId, count], i) => (
                  <div key={startupId} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>
                      {startupNameMap[startupId] || "Unknown"}
                    </span>
                    <span className="font-mono text-muted-foreground">{count} views</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No view data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Active VCs</CardTitle>
          </CardHeader>
          <CardContent>
            {topVCs.length > 0 ? (
              <div className="space-y-2">
                {topVCs.map(([vcId, count], i) => (
                  <div key={vcId} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>
                      {vcNameMap[vcId] || "Unknown"}
                      {firmMap[vcId] && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({firmMap[vcId]})
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-muted-foreground">{count} actions</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No VC activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">VC</th>
                  <th className="pb-2 pr-4">Firm</th>
                  <th className="pb-2 pr-4">Action</th>
                  <th className="pb-2 pr-4">Startup</th>
                  <th className="pb-2 text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {interactions?.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{vcNameMap[i.vc_user_id] || "Unknown"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {firmMap[i.vc_user_id] || "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge className={`text-xs capitalize ${typeBadge[i.interaction_type] || ""}`}>
                        {i.interaction_type}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 font-medium">
                      {startupNameMap[i.startup_id] || "Unknown"}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {new Date(i.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!interactions || interactions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No interactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
