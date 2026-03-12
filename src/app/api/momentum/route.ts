import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// School tier scoring — top schools get higher base scores
const SCHOOL_TIERS: Record<string, number> = {
  // Tier 1 (100 points)
  stanford: 100, mit: 100, harvard: 100, yale: 100, princeton: 100,
  caltech: 100, "university of pennsylvania": 100, columbia: 100,
  // Tier 2 (85 points)
  berkeley: 85, "uc berkeley": 85, cornell: 85, duke: 85, "carnegie mellon": 85,
  northwestern: 85, "university of michigan": 85, ucla: 85, nyu: 85, brown: 85,
  dartmouth: 85, "georgia tech": 85, "university of texas": 85, rice: 85,
  // Tier 3 (70 points)
  usc: 70, "boston university": 70, "university of virginia": 70,
  "university of illinois": 70, "purdue": 70, "university of washington": 70,
  "university of wisconsin": 70, "ohio state": 70, "penn state": 70,
};

function getSchoolScore(school: string | null): number {
  if (!school) return 30;
  const normalized = school.toLowerCase().trim();
  // Check for partial matches
  for (const [key, score] of Object.entries(SCHOOL_TIERS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return score;
    }
  }
  return 50; // Default for unlisted schools
}

function getProfileCompleteness(startup: {
  name: string;
  one_liner: string | null;
  description: string | null;
  school: string | null;
  location: string | null;
  website_url: string | null;
  industries: string[];
  founding_date: string | null;
  funding_raised: number;
  team_size: number;
}): number {
  let filled = 0;
  const total = 10;
  if (startup.name) filled++;
  if (startup.one_liner) filled++;
  if (startup.description) filled++;
  if (startup.school) filled++;
  if (startup.location) filled++;
  if (startup.website_url) filled++;
  if (startup.industries?.length > 0) filled++;
  if (startup.founding_date) filled++;
  if (startup.funding_raised > 0) filled++;
  if (startup.team_size > 1) filled++;
  return (filled / total) * 100;
}

function getUpdateFrequency(
  updateCount: number,
  daysSinceCreation: number
): number {
  if (daysSinceCreation <= 0) return updateCount > 0 ? 100 : 0;
  // Ideal: ~2 updates per week
  const updatesPerWeek = (updateCount / daysSinceCreation) * 7;
  if (updatesPerWeek >= 2) return 100;
  if (updatesPerWeek >= 1) return 80;
  if (updatesPerWeek >= 0.5) return 60;
  if (updatesPerWeek >= 0.25) return 40;
  if (updateCount > 0) return 20;
  return 0;
}

function getUpdateRecency(lastUpdateDate: string | null): number {
  if (!lastUpdateDate) return 0;
  const daysSince =
    (Date.now() - new Date(lastUpdateDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 1) return 100;
  if (daysSince <= 3) return 90;
  if (daysSince <= 7) return 75;
  if (daysSince <= 14) return 50;
  if (daysSince <= 30) return 25;
  return 10;
}

function getApplicationActivity(appCount: number): number {
  if (appCount >= 5) return 100;
  if (appCount >= 3) return 80;
  if (appCount >= 2) return 60;
  if (appCount >= 1) return 40;
  return 0;
}

// Default weights from PROJECT_SPEC.md
const DEFAULT_WEIGHTS = {
  school_tier: 0.3,
  profile_completeness: 0.2,
  update_frequency: 0.2,
  update_recency: 0.15,
  application_activity: 0.15,
};

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify caller is admin (or allow cron with secret)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
    // Cron job — proceed
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
  }

  // Fetch all startups
  const { data: startups } = await supabase
    .from("startups")
    .select("id, name, one_liner, description, school, location, website_url, industries, founding_date, funding_raised, team_size, created_at");

  if (!startups || startups.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const startupIds = startups.map((s) => s.id);

  // Fetch update counts and latest update per startup
  const { data: updates } = await supabase
    .from("updates")
    .select("startup_id, created_at")
    .in("startup_id", startupIds)
    .order("created_at", { ascending: false });

  const updateCountMap: Record<string, number> = {};
  const latestUpdateMap: Record<string, string> = {};
  for (const u of updates || []) {
    updateCountMap[u.startup_id] = (updateCountMap[u.startup_id] || 0) + 1;
    if (!latestUpdateMap[u.startup_id]) {
      latestUpdateMap[u.startup_id] = u.created_at;
    }
  }

  // Fetch application counts per startup
  const { data: apps } = await supabase
    .from("applications")
    .select("startup_id")
    .in("startup_id", startupIds);

  const appCountMap: Record<string, number> = {};
  for (const a of apps || []) {
    appCountMap[a.startup_id] = (appCountMap[a.startup_id] || 0) + 1;
  }

  // Calculate and update scores
  let updated = 0;
  for (const startup of startups) {
    const daysSinceCreation =
      (Date.now() - new Date(startup.created_at).getTime()) /
      (1000 * 60 * 60 * 24);

    const schoolScore = getSchoolScore(startup.school);
    const profileScore = getProfileCompleteness(startup);
    const freqScore = getUpdateFrequency(
      updateCountMap[startup.id] || 0,
      daysSinceCreation
    );
    const recencyScore = getUpdateRecency(latestUpdateMap[startup.id] || null);
    const appScore = getApplicationActivity(appCountMap[startup.id] || 0);

    const momentum =
      schoolScore * DEFAULT_WEIGHTS.school_tier +
      profileScore * DEFAULT_WEIGHTS.profile_completeness +
      freqScore * DEFAULT_WEIGHTS.update_frequency +
      recencyScore * DEFAULT_WEIGHTS.update_recency +
      appScore * DEFAULT_WEIGHTS.application_activity;

    const clampedScore = Math.min(100, Math.max(0, Math.round(momentum * 100) / 100));

    await supabase
      .from("startups")
      .update({ momentum_score: clampedScore })
      .eq("id", startup.id);

    updated++;
  }

  return NextResponse.json({ updated, timestamp: new Date().toISOString() });
}
