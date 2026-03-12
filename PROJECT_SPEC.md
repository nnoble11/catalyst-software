# Catalyst Labs - Project Specification
## "PitchBook for Student Startups"

---

## 1. Vision

Catalyst Labs is a two-sided platform that captures student startup data earlier than anyone else, gives founders a free home to showcase and track their progress, gives VCs a premium data layer to discover and engage with the next generation of startups, and gives accelerators a frictionless application pipeline.

The platform's core differentiator is **Momentum** — a proprietary, real-time score that algorithmically measures how fast a startup is growing across multiple dimensions.

---

## 2. Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | Next.js 14+ (App Router, TypeScript) |
| Database     | Supabase (PostgreSQL + Realtime)  |
| Auth         | Supabase Auth                     |
| Storage      | Supabase Storage (logos, decks)   |
| Hosting      | Vercel                            |
| Styling      | Tailwind CSS + shadcn/ui          |
| State        | React Server Components + TanStack Query |
| Payments     | Stripe (future)                   |

---

## 3. User Roles

### 3.1 Founder (Free)
- Create account, build startup profile
- Post updates/progress (social feed)
- Browse & 1-click apply to accelerators
- Cannot see Momentum score (for now)
- Cannot see who viewed their profile (for now)

### 3.2 VC (Paid - pricing TBD)
- Browse all startups in sortable/filterable table
- See Momentum scores
- Bookmark/save startups into lists
- Contact founders directly (in-platform messaging or email)
- List accelerator programs on the Accelerator Marketplace

### 3.3 Admin (Catalyst Team)
- See all data: which VCs view which startups
- View interaction analytics (views, bookmarks, messages, applications)
- Manage Momentum algorithm weights
- Manage users, startups, accelerators
- Platform-wide analytics dashboard

---

## 4. Data Models

### 4.1 Startup Profile
```
startup {
  id: uuid
  name: string
  logo: file (image)
  one_liner: string (140 chars)
  description: text
  website_url: string
  school: string (university name)
  stage: enum [idea, pre-seed, seed, series-a, series-b+]
  industry: string[] (tags: fintech, healthtech, edtech, etc.)
  founding_date: date
  team_size: number
  funding_raised: number (USD)
  pitch_deck_url: file (PDF)
  location: string
  founders: founder[] (relation)
  momentum_score: number (0-100, computed)
  created_at: timestamp
  updated_at: timestamp
}
```

### 4.2 Founder (User)
```
founder {
  id: uuid (supabase auth user)
  full_name: string
  email: string
  role_title: string (CEO, CTO, etc.)
  school: string
  graduation_year: number
  linkedin_url: string
  avatar: file (image)
  created_at: timestamp
}
```

### 4.2b Startup-Founder (Many-to-Many Join)
```
startup_founder {
  startup_id: uuid (FK)
  founder_id: uuid (FK)
  role: enum [primary, co-founder]
  joined_at: timestamp
}
```

### 4.3 VC User
```
vc_user {
  id: uuid (supabase auth user)
  full_name: string
  email: string
  firm_name: string
  firm_logo: file
  title: string
  linkedin_url: string
  avatar: file
  subscription_tier: enum [free, pro, enterprise] (future)
  created_at: timestamp
}
```

### 4.4 Update (Feed Post)
```
update {
  id: uuid
  startup_id: uuid (FK)
  author_id: uuid (FK to founder)
  content: text (markdown or rich text)
  update_type: enum [milestone, metric, announcement, general]
  attachments: file[] (optional images/docs)
  created_at: timestamp
}
```

### 4.5 Accelerator Program
```
accelerator {
  id: uuid
  vc_user_id: uuid (FK - the VC who owns this listing)
  name: string
  description: text
  logo: file
  application_deadline: date
  program_start_date: date
  program_duration: string
  location: string
  equity_taken: string (e.g. "5-7%")
  funding_provided: string (e.g. "$125k")
  industries: string[] (tags)
  stages_accepted: enum[] (which stages)
  is_active: boolean
  created_at: timestamp
}
```

### 4.6 Application (1-Click Apply)
```
application {
  id: uuid
  startup_id: uuid (FK)
  accelerator_id: uuid (FK)
  status: enum [submitted, reviewing, accepted, rejected]
  applied_at: timestamp
  updated_at: timestamp
}
```

### 4.7 VC Interactions (Admin Analytics)
```
vc_interaction {
  id: uuid
  vc_user_id: uuid (FK)
  startup_id: uuid (FK)
  interaction_type: enum [view, bookmark, unbookmark, message, download_deck]
  created_at: timestamp
}
```

### 4.8 Conversation (Messaging)
```
conversation {
  id: uuid
  participants: uuid[] (founder + VC user IDs)
  startup_id: uuid (FK — context for the conversation)
  created_at: timestamp
  updated_at: timestamp
}
```

### 4.9 Message
```
message {
  id: uuid
  conversation_id: uuid (FK)
  sender_id: uuid (FK)
  content: text
  read: boolean
  created_at: timestamp
}
```

### 4.10 VC Bookmark Lists
```
bookmark_list {
  id: uuid
  vc_user_id: uuid (FK)
  name: string (e.g. "Watchlist", "Top Picks Q1")
  startup_ids: uuid[] (or join table)
  created_at: timestamp
}
```

---

## 5. Core Features (MVP)

### 5.1 Founder Flow
1. **Sign Up** → Supabase Auth (email/password, Google OAuth)
2. **Onboarding** → Multi-step form to create startup profile
   - Step 1: Startup basics (name, one-liner, school, stage, industry)
   - Step 2: Details (team size, funding, website, founding date)
   - Step 3: Upload logo + pitch deck
   - Step 4: Add co-founders (invite by email)
3. **Dashboard** → View their startup profile, see their updates feed
4. **Post Updates** → Create feed posts (milestones, metrics, announcements)
5. **Accelerator Marketplace** → Browse active accelerator listings, 1-click apply
6. **Profile Page** → Public-facing startup page (visible to VCs)

### 5.2 VC Flow
1. **Sign Up** → Separate VC registration flow (firm name, title, etc.)
2. **Dashboard / Deal Table** → Sortable, filterable table of all startups
   - Columns: Logo, Name, School, Stage, Industry, Momentum, Team Size, Funding Raised, Founded, Location
   - All columns sortable
   - Filters: stage, industry, school, momentum range, funding range
   - Search bar (full-text across name, one-liner, description)
3. **Startup Detail View** → Click into a startup to see full profile + feed
4. **Bookmark/Save** → Add startups to named lists
5. **Contact Founder** → Send message or request intro
6. **Accelerator Listing** → Create and manage accelerator program listings
7. **View Applications** → See which startups applied to their accelerator

### 5.3 Admin Panel
1. **Interaction Analytics** → See which VCs are looking at which startups
   - Heatmap: most-viewed startups
   - Per-VC activity log
   - Per-startup interest signals
2. **User Management** → View/edit/deactivate any user
3. **Startup Management** → Edit/flag/remove startups
4. **Momentum Config** → Adjust algorithm weights (future)
5. **Platform Metrics** → Total users, startups, applications, DAU, etc.

---

## 6. Momentum Score (v1 - Simple)

For MVP, Momentum is a 0-100 score computed from available signals. Starting simple, expanding over time.

### v1 Formula (MVP - School-Based Baseline + Activity)
```
momentum = weighted_sum(
  school_tier_score,        // weight: 30% — based on school ranking/reputation
  profile_completeness,     // weight: 20% — how filled out is the profile
  update_frequency,         // weight: 20% — how often they post updates
  update_recency,           // weight: 15% — when was the last update
  application_activity,     // weight: 15% — are they actively applying to accelerators
)
```

### v2 Formula (Future - Full Momentum)
```
momentum = weighted_sum(
  school_tier_score,
  profile_completeness,
  update_frequency,
  update_recency,
  funding_velocity,          // speed of fundraising
  team_growth_rate,          // how fast team is growing
  vc_interest_signals,       // views, bookmarks, messages from VCs
  accelerator_acceptance,    // accepted into programs
  metric_trajectory,         // self-reported metrics trending up
  development_velocity,      // GitHub commits, product launches (future integration)
  external_press,            // mentions in news/social (future integration)
)
```

Momentum is **recalculated periodically** (e.g., daily cron job or on-demand).

---

## 7. Pages / Routes

### Public
- `/` — Landing page (marketing)
- `/login` — Login
- `/signup/founder` — Founder registration
- `/signup/vc` — VC registration

### Founder (authenticated)
- `/dashboard` — Founder dashboard
- `/startup/edit` — Edit startup profile
- `/updates` — Manage updates / create new post
- `/accelerators` — Browse accelerator marketplace
- `/accelerators/[id]` — Accelerator detail + apply
- `/applications` — Track application status

### VC (authenticated)
- `/deals` — Deal table (main VC view)
- `/deals/[startup-id]` — Startup detail view + feed
- `/lists` — Saved bookmark lists
- `/lists/[id]` — View a specific list
- `/accelerator/manage` — Create/edit accelerator listings
- `/accelerator/applications` — View applications to their program
- `/messages` — Message inbox
- `/messages/[conversation-id]` — Conversation thread

### Admin (authenticated, role-gated)
- `/admin` — Admin dashboard overview
- `/admin/analytics` — Interaction analytics
- `/admin/users` — User management
- `/admin/startups` — Startup management
- `/admin/momentum` — Momentum algorithm config

---

## 8. Key Design Decisions

1. **Supabase handles everything**: Auth, DB, Storage, Realtime (for live feed updates), Row Level Security for role-based access
2. **1-Click Apply**: When a founder clicks "Apply" on an accelerator, their existing startup profile data is submitted as the application. No extra forms. This is the value prop — fill out your profile once, apply everywhere.
3. **VC Interactions are silently logged**: Every view, bookmark, and message creates a `vc_interaction` record. Founders don't see this. Admins do.
4. **Momentum is server-computed**: Not exposed as an API. Calculated via Supabase Edge Function or cron job. Stored as a column on the startup table for fast sorting.
5. **Feed is per-startup**: Updates belong to a startup, not a founder. All co-founders can post. VCs see the feed on the startup detail page.

---

## 9. MVP Milestones

### Phase 1: Foundation
- [ ] Project setup (Next.js, Supabase, Vercel, Tailwind, shadcn)
- [ ] Supabase schema + Row Level Security policies
- [ ] Auth flows (founder signup, VC signup, login)
- [ ] Role-based routing/middleware

### Phase 2: Founder Experience
- [ ] Onboarding flow (multi-step startup creation)
- [ ] Startup profile page
- [ ] Update/feed system (create, view, edit, delete)
- [ ] Founder dashboard

### Phase 3: VC Experience
- [ ] Deal table with sorting, filtering, search
- [ ] Startup detail view (profile + feed)
- [ ] Bookmark/list system
- [ ] Contact founder flow

### Phase 4: Accelerator Marketplace
- [ ] Accelerator listing creation (VC side)
- [ ] Accelerator browse/search (founder side)
- [ ] 1-click apply flow
- [ ] Application tracking (both sides)

### Phase 5: Momentum + Admin
- [ ] Momentum v1 algorithm + cron job
- [ ] Admin dashboard
- [ ] Interaction analytics
- [ ] User/startup management

### Phase 6: Polish + Launch
- [ ] Landing page
- [ ] Email notifications (welcome, application status, new messages)
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Beta launch

---

## 10. Resolved Decisions

1. **Messaging**: In-platform messaging system (keeps all data on-platform, better analytics)
2. **Multiple startups per founder**: Yes — a founder can be part of multiple startups (many-to-many relationship)
3. **Startup verification**: No verification required — low friction onboarding
4. **Co-founder permissions**: TBD (default: all co-founders can edit and post)
5. **Accelerator application data**: Profile-only for now (1-click apply with existing data)
6. **Public profiles**: No — startup profiles are behind auth, only visible to VCs. This is part of the paid value prop.
7. **Momentum visibility**: Yes — founders can see their own Momentum score (growth tool / gamification)

## 11. Open Questions

1. **Co-founder permissions**: Should all co-founders have equal edit access, or should there be a primary/admin founder?
