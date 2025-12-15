-- 1. Updates to Markets Table (Visual Polish)
alter table public.markets 
add column if not exists home_logo text,
add column if not exists away_logo text;

-- 2. Updates to Profiles Table (Affiliate System)
alter table public.profiles
add column if not exists referral_code text unique,
add column if not exists referred_by text references public.profiles(referral_code);

-- 3. Function to Generate Unique Referral Code
create or replace function public.generate_referral_code()
returns trigger as $$
begin
  -- Generate a random 6-character code (Upper case + Numbers)
  -- Loop ensures uniqueness (collision is rare but possible)
  loop
    new.referral_code := upper(substring(md5(random()::text) from 1 for 6));
    if not exists (select 1 from public.profiles where referral_code = new.referral_code) then
      exit;
    end if;
  end loop;
  return new;
end;
$$ language plpgsql;

-- 4. Trigger to auto-assign referral code on Profile Creation
drop trigger if exists on_profile_created_referral on public.profiles;
create trigger on_profile_created_referral
  before insert on public.profiles
  for each row
  execute procedure public.generate_referral_code();

-- 5. Backfill for existing users (who don't have a code)
do $$
declare
  r record;
  new_code text;
begin
  for r in select id from public.profiles where referral_code is null loop
    loop
      new_code := upper(substring(md5(random()::text) from 1 for 6));
      if not exists (select 1 from public.profiles where referral_code = new_code) then
        exit;
      end if;
    end loop;
    
    update public.profiles
    set referral_code = new_code
    where id = r.id;
  end loop;
end;
$$;
