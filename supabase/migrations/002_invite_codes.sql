-- ============================================
-- Invite Codes Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enums
create type invite_code_type as enum ('single_use', 'multi_use');
create type invite_role_restriction as enum ('founder', 'vc', 'any');

-- Tables
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

-- Indexes
create index idx_invite_codes_code on invite_codes (code);
create index idx_invite_code_uses_code on invite_code_uses (code_id);

-- RLS
alter table invite_codes enable row level security;
alter table invite_code_uses enable row level security;

-- Admins can do everything with invite codes
create policy "Admins can manage invite codes" on invite_codes
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Anyone authenticated can read codes (needed for validation during signup)
create policy "Authenticated can read invite codes" on invite_codes
  for select using (auth.role() = 'authenticated');

-- Admins can view usage history
create policy "Admins can view invite code uses" on invite_code_uses
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Authenticated users can record their own code use
create policy "Authenticated can insert invite code uses" on invite_code_uses
  for insert with check (auth.role() = 'authenticated');

-- RPC: atomically increment uses_count
create or replace function increment_invite_uses(p_code_id uuid)
returns void as $$
begin
  update invite_codes
  set uses_count = uses_count + 1
  where id = p_code_id;
end;
$$ language plpgsql security definer;
