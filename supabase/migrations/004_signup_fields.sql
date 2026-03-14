-- Add traction and support fields to startups
alter table startups add column if not exists monthly_revenue numeric(12, 2) default 0;
alter table startups add column if not exists user_count integer default 0;
alter table startups add column if not exists support_needed text[] default '{}';

-- Update the handle_new_user trigger to also save linkedin_url
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, email, linkedin_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'founder')::public.user_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'linkedin_url', '')
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
