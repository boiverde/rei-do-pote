-- FIX SECURITY: PRIVILEGE ESCALATION
-- Prevents users from making themselves Admins by updating 'is_admin' column.

CREATE OR REPLACE FUNCTION public.protect_critical_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if is_admin is being changed
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      -- If the user is NOT an admin, revert the change or raise error.
      -- To avoid recursion, we can just check if the current user is an admin via a separate query
      -- OR strictly: Only allow is_admin changes if the executing role is 'service_role' (from Supabase Dashboard)
      -- OR allow existing admins (complex).
      
      -- Helper: Check if current request is from an Admin
      IF NOT EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND is_admin = true
      ) THEN
          -- Non-admin trying to change is_admin -> BLOCK
          RAISE EXCEPTION 'You are not authorized to change administrative privileges.';
      END IF;
  END IF;

  -- Also protect Balance from direct updates (Only allow via RPCs)
  -- If we want to be strict:
  IF NEW.balance IS DISTINCT FROM OLD.balance THEN
      -- Allow updates ONLY if they come from our secure RPC functions (deposit, withdraw, bet)
      -- In Postgres/Supabase, RPCs can run as SECURITY DEFINER (superuser for the function).
      -- But triggers run as the user.
      -- Strategy: If we want strict RPC-only balance updates, we need to revoke UPDATE on profile.balance.
      -- FOR NOW: Let's focus on is_admin.
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Trigger
DROP TRIGGER IF EXISTS tr_protect_profiles ON public.profiles;
CREATE TRIGGER tr_protect_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_critical_columns();
