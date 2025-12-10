-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text,
  full_name text,
  avatar_url text,
  balance decimal default 1000.00, -- Give 1000 start balance
  constraint username_length check (char_length(username) >= 3)
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- 4. Trigger for New Users (Handle new signups)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, balance)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 1000.00);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication error on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. CRITICAL: Backfill for EXISTING users (You!)
-- This inserts a profile for any user that already exists but doesn't have a profile.
insert into public.profiles (id, balance)
select id, 1000.00
from auth.users
where id not in (select id from public.profiles)
on conflict do nothing;
