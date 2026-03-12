-- ============================================
-- Startup Invites Migration (Multi-Founder Support)
-- Run this in the Supabase SQL Editor
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

-- RLS
alter table startup_invites enable row level security;

-- Founders of a startup can create invites
create policy "Founders can invite to their startups" on startup_invites
  for insert with check (
    exists (
      select 1 from startup_founders
      where startup_founders.startup_id = startup_invites.startup_id
      and startup_founders.founder_id = auth.uid()
    )
  );

-- Users can see invites sent to them, or invites they sent, or invites for their startups
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

-- Invitees can accept/decline
create policy "Invitees can update invite status" on startup_invites
  for update using (
    invitee_email = (select email from profiles where id = auth.uid())
  );
