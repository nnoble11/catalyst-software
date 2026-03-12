import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecalculateButton } from "@/components/recalculate-button";

export default async function AdminMomentumPage() {
  const supabase = await createClient();

  // Get all startups with momentum scores
  const { data: startups } = await supabase
    .from("startups")
    .select("id, name, school, stage, momentum_score, updated_at")
    .order("momentum_score", { ascending: false });

  // Current weights (hardcoded for v1 — configurable in v2)
  const weights = [
    { factor: "School Tier", weight: "30%", description: "Based on school ranking/reputation" },
    { factor: "Profile Completeness", weight: "20%", description: "How filled out the startup profile is" },
    { factor: "Update Frequency", weight: "20%", description: "How often they post updates" },
    { factor: "Update Recency", weight: "15%", description: "When was the last update posted" },
    { factor: "Application Activity", weight: "15%", description: "Actively applying to accelerators" },
  ];

  // Score distribution
  const distribution = { high: 0, medium: 0, low: 0, none: 0 };
  for (const s of startups || []) {
    const score = Number(s.momentum_score);
    if (score >= 70) distribution.high++;
    else if (score >= 40) distribution.medium++;
    else if (score > 0) distribution.low++;
    else distribution.none++;
  }

  return (
    <main className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Momentum Configuration</h1>
          <p className="text-sm text-muted-foreground">v1 Algorithm — {startups?.length || 0} startups scored</p>
        </div>
        <RecalculateButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Algorithm Weights (v1)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weights.map((w) => (
                <div key={w.factor} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{w.factor}</p>
                    <p className="text-xs text-muted-foreground">{w.description}</p>
                  </div>
                  <Badge variant="outline">{w.weight}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">High (70-100)</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded bg-green-500" style={{ width: `${Math.max(4, distribution.high * 8)}px` }} />
                  <span className="text-sm font-medium">{distribution.high}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Medium (40-69)</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded bg-yellow-500" style={{ width: `${Math.max(4, distribution.medium * 8)}px` }} />
                  <span className="text-sm font-medium">{distribution.medium}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Low (1-39)</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded bg-orange-500" style={{ width: `${Math.max(4, distribution.low * 8)}px` }} />
                  <span className="text-sm font-medium">{distribution.low}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Unscored (0)</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded bg-gray-300" style={{ width: `${Math.max(4, distribution.none * 8)}px` }} />
                  <span className="text-sm font-medium">{distribution.none}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Startups — Momentum Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">School</th>
                  <th className="pb-2 pr-4">Stage</th>
                  <th className="pb-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {startups?.map((s, i) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium">{s.name}</td>
                    <td className="py-2 pr-4">{s.school || "—"}</td>
                    <td className="py-2 pr-4 capitalize">{s.stage?.replace("_", " ") || "—"}</td>
                    <td className="py-2 text-right font-mono font-medium">
                      {Number(s.momentum_score) > 0
                        ? Number(s.momentum_score).toFixed(1)
                        : "—"}
                    </td>
                  </tr>
                ))}
                {(!startups || startups.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No startups found.
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
