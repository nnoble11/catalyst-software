-- ============================================
-- Catalyst Labs - Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. Profiles (extends Supabase auth.users)
-- ============================================
create type user_role as enum ('founder', 'vc', 'admin');

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role not null,
  full_name text not null,
  email text not null,
  avatar_url text,
  linkedin_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- 2. Founder Profiles
-- ============================================
create table founder_profiles (
  id uuid references profiles on delete cascade primary key,
  role_title text, -- CEO, CTO, etc.
  school text,
  graduation_year integer
);

-- ============================================
-- 3. VC Profiles
-- ============================================
create table vc_profiles (
  id uuid references profiles on delete cascade primary key,
  firm_name text not null,
  firm_logo_url text,
  title text -- Partner, Analyst, etc.
);

-- ============================================
-- 4. Startups
-- ============================================
create type startup_stage as enum ('idea', 'pre_seed', 'seed', 'series_a', 'series_b_plus');

create table startups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  one_liner text, -- 140 char tagline
  description text,
  logo_url text,
  website_url text,
  school text,
  stage startup_stage default 'idea',
  industries text[] default '{}',
  founding_date date,
  team_size integer default 1,
  funding_raised numeric(12, 2) default 0,
  pitch_deck_url text,
  location text,
  momentum_score numeric(5, 2) default 0, -- 0-100
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- 5. Startup-Founder join (many-to-many)
-- ============================================
create type founder_role as enum ('primary', 'co_founder');

create table startup_founders (
  startup_id uuid references startups on delete cascade not null,
  founder_id uuid references profiles on delete cascade not null,
  role founder_role default 'co_founder',
  joined_at timestamptz default now() not null,
  primary key (startup_id, founder_id)
);

-- ============================================
-- 6. Updates (feed posts)
-- ============================================
create type update_type as enum ('milestone', 'metric', 'announcement', 'general');

create table updates (
  id uuid default uuid_generate_v4() primary key,
  startup_id uuid references startups on delete cascade not null,
  author_id uuid references profiles on delete cascade not null,
  content text not null,
  update_type update_type default 'general',
  created_at timestamptz default now() not null
);

-- ============================================
-- 7. Accelerator Programs
-- ============================================
create table accelerators (
  id uuid default uuid_generate_v4() primary key,
  vc_user_id uuid references profiles on delete cascade not null,
  name text not null,
  description text,
  logo_url text,
  application_deadline date,
  program_start_date date,
  program_duration text,
  location text,
  equity_taken text,
  funding_provided text,
  industries text[] default '{}',
  stages_accepted startup_stage[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now() not null
);

-- ============================================
-- 8. Applications (1-click apply)
-- ============================================
create type application_status as enum ('submitted', 'reviewing', 'accepted', 'rejected');

create table applications (
  id uuid default uuid_generate_v4() primary key,
  startup_id uuid references startups on delete cascade not null,
  accelerator_id uuid references accelerators on delete cascade not null,
  status application_status default 'submitted',
  applied_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (startup_id, accelerator_id) -- prevent duplicate applications
);

-- ============================================
-- 9. VC Interactions (analytics tracking)
-- ============================================
create type interaction_type as enum ('view', 'bookmark', 'unbookmark', 'message', 'download_deck');

create table vc_interactions (
  id uuid default uuid_generate_v4() primary key,
  vc_user_id uuid references profiles on delete cascade not null,
  startup_id uuid references startups on delete cascade not null,
  interaction_type interaction_type not null,
  created_at timestamptz default now() not null
);

-- ============================================
-- 10. Conversations (messaging)
-- ============================================
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  startup_id uuid references startups on delete cascade, -- context
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table conversation_participants (
  conversation_id uuid references conversations on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  primary key (conversation_id, user_id)
);

create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations on delete cascade not null,
  sender_id uuid references profiles on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now() not null
);

-- ============================================
-- 11. Bookmark Lists
-- ============================================
create table bookmark_lists (
  id uuid default uuid_generate_v4() primary key,
  vc_user_id uuid references profiles on delete cascade not null,
  name text not null default 'Watchlist',
  created_at timestamptz default now() not null
);

create table bookmark_list_items (
  list_id uuid references bookmark_lists on delete cascade not null,
  startup_id uuid references startups on delete cascade not null,
  added_at timestamptz default now() not null,
  primary key (list_id, startup_id)
);

-- ============================================
-- 12. Invite Codes (platform access control)
-- ============================================
create type invite_code_type as enum ('single_use', 'multi_use');
create type invite_role_restriction as enum ('founder', 'vc', 'any');

create table invite_codes (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  type invite_code_type default 'single_use',
  max_uses integer default 1,
  uses_count integer default 0,
  created_by uuid references profiles on delete set null,
  role_restriction invite_role_restriction default 'any',
  is_active boolean default true,
  created_at timestamptz default now() not null,
  expires_at timestamptz
);

create table invite_code_uses (
  id uuid default uuid_generate_v4() primary key,
  code_id uuid references invite_codes on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  used_at timestamptz default now() not null
);

create index idx_invite_codes_code on invite_codes (code);
create index idx_invite_code_uses_code on invite_code_uses (code_id);

-- RPC: atomically increment uses_count
create or replace function increment_invite_uses(p_code_id uuid)
returns void as $$
begin
  update invite_codes
  set uses_count = uses_count + 1
  where id = p_code_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- 12b. Startup Invites (multi-founder support)
-- ============================================
create type invite_status as enum ('pending', 'accepted', 'declined');

create table startup_invites (
  id uuid default uuid_generate_v4() primary key,
  startup_id uuid references startups on delete cascade not null,
  inviter_id uuid references profiles on delete cascade not null,
  invitee_email text not null,
  status invite_status default 'pending',
  created_at timestamptz default now() not null,
  expires_at timestamptz,
  unique (startup_id, invitee_email)
);

create index idx_startup_invites_email on startup_invites (invitee_email);
create index idx_startup_invites_startup on startup_invites (startup_id);

-- ============================================
-- 13. Indexes for performance
-- ============================================
create index idx_startups_stage on startups (stage);
create index idx_startups_momentum on startups (momentum_score desc);
create index idx_startups_school on startups (school);
create index idx_startups_created on startups (created_at desc);
create index idx_updates_startup on updates (startup_id, created_at desc);
create index idx_vc_interactions_startup on vc_interactions (startup_id, created_at desc);
create index idx_vc_interactions_vc on vc_interactions (vc_user_id, created_at desc);
create index idx_messages_conversation on messages (conversation_id, created_at);
create index idx_applications_startup on applications (startup_id);
create index idx_applications_accelerator on applications (accelerator_id);
create index idx_startup_founders_founder on startup_founders (founder_id);

-- ============================================
-- 13. Row Level Security
-- ============================================
alter table profiles enable row level security;
alter table founder_profiles enable row level security;
alter table vc_profiles enable row level security;
alter table startups enable row level security;
alter table startup_founders enable row level security;
alter table updates enable row level security;
alter table accelerators enable row level security;
alter table applications enable row level security;
alter table vc_interactions enable row level security;
alter table conversations enable row level security;
alter table invite_codes enable row level security;
alter table invite_code_uses enable row level security;
alter table startup_invites enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table bookmark_lists enable row level security;
alter table bookmark_list_items enable row level security;

-- Profiles: users can read all profiles, update own
create policy "Profiles are viewable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Founder profiles
create policy "Founder profiles viewable by authenticated" on founder_profiles
  for select using (auth.role() = 'authenticated');
create policy "Founders can update own" on founder_profiles
  for update using (auth.uid() = id);
create policy "Founders can insert own" on founder_profiles
  for insert with check (auth.uid() = id);

-- VC profiles
create policy "VC profiles viewable by authenticated" on vc_profiles
  for select using (auth.role() = 'authenticated');
create policy "VCs can update own" on vc_profiles
  for update using (auth.uid() = id);
create policy "VCs can insert own" on vc_profiles
  for insert with check (auth.uid() = id);

-- Startups: VCs and admins can read all, founders can read/write their own
create policy "Startups viewable by authenticated" on startups
  for select using (auth.role() = 'authenticated');
create policy "Founders can insert startups" on startups
  for insert with check (auth.role() = 'authenticated');
create policy "Founders can update own startups" on startups
  for update using (
    exists (
      select 1 from startup_founders
      where startup_founders.startup_id = id
      and startup_founders.founder_id = auth.uid()
    )
  );

-- Startup founders join
create policy "Startup founders viewable by authenticated" on startup_founders
  for select using (auth.role() = 'authenticated');
create policy "Can insert startup founder links" on startup_founders
  for insert with check (auth.role() = 'authenticated');

-- Updates: anyone authenticated can read, founders can write for their startups
create policy "Updates viewable by authenticated" on updates
  for select using (auth.role() = 'authenticated');
create policy "Founders can create updates" on updates
  for insert with check (
    exists (
      select 1 from startup_founders
      where startup_founders.startup_id = updates.startup_id
      and startup_founders.founder_id = auth.uid()
    )
  );

-- Accelerators: all authenticated can read, VCs can create/edit their own
create policy "Accelerators viewable by authenticated" on accelerators
  for select using (auth.role() = 'authenticated');
create policy "VCs can create accelerators" on accelerators
  for insert with check (auth.uid() = vc_user_id);
create policy "VCs can update own accelerators" on accelerators
  for update using (auth.uid() = vc_user_id);

-- Applications: founders can create, both sides can read their own
create policy "Founders can create applications" on applications
  for insert with check (
    exists (
      select 1 from startup_founders
      where startup_founders.startup_id = applications.startup_id
      and startup_founders.founder_id = auth.uid()
    )
  );
create policy "Users can view relevant applications" on applications
  for select using (
    exists (
      select 1 from startup_founders
      where startup_founders.startup_id = applications.startup_id
      and startup_founders.founder_id = auth.uid()
    )
    or exists (
      select 1 from accelerators
      where accelerators.id = applications.accelerator_id
      and accelerators.vc_user_id = auth.uid()
    )
  );

-- VC interactions: only the VC and admins
create policy "VCs can insert interactions" on vc_interactions
  for insert with check (auth.uid() = vc_user_id);
create policy "VCs can view own interactions" on vc_interactions
  for select using (auth.uid() = vc_user_id);
create policy "Admins can view all interactions" on vc_interactions
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Conversations: participants only
create policy "Participants can view conversations" on conversations
  for select using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = id
      and conversation_participants.user_id = auth.uid()
    )
  );
create policy "Authenticated can create conversations" on conversations
  for insert with check (auth.role() = 'authenticated');
create policy "Participants can update conversations" on conversations
  for update using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = id
      and conversation_participants.user_id = auth.uid()
    )
  );

-- Conversation participants: can see all participants in conversations you belong to
create policy "Can view participants in own conversations" on conversation_participants
  for select using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.user_id = auth.uid()
    )
  );
create policy "Can insert participants" on conversation_participants
  for insert with check (auth.role() = 'authenticated');

-- Messages: conversation participants only
create policy "Participants can view messages" on messages
  for select using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );
create policy "Participants can send messages" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );
create policy "Participants can mark messages as read" on messages
  for update using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );

-- Bookmark lists: VCs only, own lists
create policy "VCs can view own bookmark lists" on bookmark_lists
  for select using (auth.uid() = vc_user_id);
create policy "VCs can create bookmark lists" on bookmark_lists
  for insert with check (auth.uid() = vc_user_id);
create policy "VCs can update own bookmark lists" on bookmark_lists
  for update using (auth.uid() = vc_user_id);
create policy "VCs can delete own bookmark lists" on bookmark_lists
  for delete using (auth.uid() = vc_user_id);

-- Bookmark list items
create policy "VCs can view own bookmark items" on bookmark_list_items
  for select using (
    exists (
      select 1 from bookmark_lists
      where bookmark_lists.id = list_id
      and bookmark_lists.vc_user_id = auth.uid()
    )
  );
create policy "VCs can add bookmark items" on bookmark_list_items
  for insert with check (
    exists (
      select 1 from bookmark_lists
      where bookmark_lists.id = list_id
      and bookmark_lists.vc_user_id = auth.uid()
    )
  );
create policy "VCs can remove bookmark items" on bookmark_list_items
  for delete using (
    exists (
      select 1 from bookmark_lists
      where bookmark_lists.id = list_id
      and bookmark_lists.vc_user_id = auth.uid()
    )
  );

-- Invite codes: admins full CRUD, authenticated can SELECT for validation
create policy "Admins can manage invite codes" on invite_codes
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
create policy "Authenticated can read invite codes" on invite_codes
  for select using (auth.role() = 'authenticated');

-- Invite code uses: admins can read all, system inserts via security definer
create policy "Admins can view invite code uses" on invite_code_uses
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
create policy "Authenticated can insert invite code uses" on invite_code_uses
  for insert with check (auth.role() = 'authenticated');

-- Startup invites: founders can create for their startups, invitees can view/update
create policy "Founders can invite to their startups" on startup_invites
  for insert with check (
    exists (
      select 1 from startup_founders
      where startup_founders.startup_id = startup_invites.startup_id
      and startup_founders.founder_id = auth.uid()
    )
  );
create policy "Users can view relevant invites" on startup_invites
  for select using (
    invitee_email = (select email from profiles where id = auth.uid())
    or inviter_id = auth.uid()
    or exists (
      select 1 from startup_founders
      where startup_founders.startup_id = startup_invites.startup_id
      and startup_founders.founder_id = auth.uid()
    )
  );
create policy "Invitees can update invite status" on startup_invites
  for update using (
    invitee_email = (select email from profiles where id = auth.uid())
  );

-- ============================================
-- 14. Function: Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'founder')::public.user_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  );

  -- Create role-specific profile
  if new.raw_user_meta_data->>'role' = 'vc' then
    insert into public.vc_profiles (id, firm_name, title)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'firm_name', ''),
      coalesce(new.raw_user_meta_data->>'title', '')
    );
  else
    insert into public.founder_profiles (id, role_title, school, graduation_year)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'role_title', ''),
      coalesce(new.raw_user_meta_data->>'school', ''),
      nullif(new.raw_user_meta_data->>'graduation_year', '')::integer
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================
-- 15. Function: Update updated_at timestamp
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();

create trigger update_startups_updated_at
  before update on startups
  for each row execute procedure update_updated_at();

create trigger update_applications_updated_at
  before update on applications
  for each row execute procedure update_updated_at();

create trigger update_conversations_updated_at
  before update on conversations
  for each row execute procedure update_updated_at();
