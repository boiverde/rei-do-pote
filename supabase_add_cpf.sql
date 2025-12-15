-- Add CPF column to profiles table for secure withdrawals
alter table public.profiles 
add column if not exists cpf text unique;

-- Optional: constraint to format or length check?
-- For now, just text is enough, validation will happen in app/api
