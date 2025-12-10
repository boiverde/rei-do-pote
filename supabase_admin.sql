-- 1. Add is_admin column to profiles
alter table public.profiles 
add column if not exists is_admin boolean default false;

-- 2. DEV ONLY: Make ALL current users Admins (So you get access immediately)
update public.profiles set is_admin = true;

-- 3. Update Markets RLS to allow Admins to Create/Update
-- (First, ensure RLS is on)
alter table public.markets enable row level security;

-- Existing policy was just "Public can view markets". Let's keep that.

-- Add Admin Policies
drop policy if exists "Admins can insert markets" on public.markets;
create policy "Admins can insert markets" on public.markets
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Admins can update markets" on public.markets;
create policy "Admins can update markets" on public.markets
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Allow admins to delete too, why not
drop policy if exists "Admins can delete markets" on public.markets;
create policy "Admins can delete markets" on public.markets
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
