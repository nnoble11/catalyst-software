export type UserRole = "founder" | "vc" | "admin";
export type StartupStage = "idea" | "pre_seed" | "seed" | "series_a" | "series_b_plus";
export type UpdateType = "milestone" | "metric" | "announcement" | "general";
export type FounderRole = "primary" | "co_founder";
export type ApplicationStatus = "submitted" | "reviewing" | "accepted" | "rejected";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FounderProfile {
  id: string;
  role_title: string | null;
  school: string | null;
  graduation_year: number | null;
}

export interface VCProfile {
  id: string;
  firm_name: string;
  firm_logo_url: string | null;
  title: string | null;
}

export interface Startup {
  id: string;
  name: string;
  one_liner: string | null;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  school: string | null;
  stage: StartupStage;
  industries: string[];
  founding_date: string | null;
  team_size: number;
  funding_raised: number;
  pitch_deck_url: string | null;
  location: string | null;
  momentum_score: number;
  monthly_revenue: number;
  user_count: number;
  support_needed: string[];
  created_at: string;
  updated_at: string;
}

export interface StartupFounder {
  startup_id: string;
  founder_id: string;
  role: FounderRole;
  joined_at: string;
}

export interface Update {
  id: string;
  startup_id: string;
  author_id: string;
  content: string;
  update_type: UpdateType;
  created_at: string;
  // Joined fields
  author?: Profile;
}

export const STAGE_LABELS: Record<StartupStage, string> = {
  idea: "Idea",
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b_plus: "Series B+",
};

export const INDUSTRY_OPTIONS = [
  "AI/ML",
  "B2B SaaS",
  "Climate",
  "Consumer",
  "Crypto/Web3",
  "E-Commerce",
  "EdTech",
  "Enterprise",
  "FinTech",
  "FoodTech",
  "Gaming",
  "HealthTech",
  "Hardware",
  "Legal",
  "Logistics",
  "Marketplace",
  "Media",
  "Proptech",
  "Robotics",
  "Social",
  "Space",
  "Other",
];

export const SUPPORT_OPTIONS = [
  "Mentorship",
  "Introductions",
  "Technical",
  "Hiring",
  "Go-to-Market",
];

export const UPDATE_TYPE_LABELS: Record<UpdateType, string> = {
  milestone: "Milestone",
  metric: "Metric",
  announcement: "Announcement",
  general: "General",
};

// Invite codes
export type InviteCodeType = "single_use" | "multi_use";
export type InviteRoleRestriction = "founder" | "vc" | "any";

export interface InviteCode {
  id: string;
  code: string;
  type: InviteCodeType;
  max_uses: number;
  uses_count: number;
  created_by: string;
  role_restriction: InviteRoleRestriction;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface InviteCodeUse {
  id: string;
  code_id: string;
  user_id: string;
  used_at: string;
}

// Multi-founder invites
export type InviteStatus = "pending" | "accepted" | "declined";

export interface StartupInvite {
  id: string;
  startup_id: string;
  inviter_id: string;
  invitee_email: string;
  status: InviteStatus;
  created_at: string;
  expires_at: string | null;
  // Joined fields
  startup?: { name: string };
  inviter?: { full_name: string };
}
