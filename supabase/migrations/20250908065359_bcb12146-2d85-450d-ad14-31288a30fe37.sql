-- Remove duplicate diagnose_auth_state functions and keep only the correct one

begin;

-- Drop any existing diagnose_auth_state functions to avoid conflicts
drop function if exists public.diagnose_auth_state() cascade;
drop function if exists public.diagnose_auth_state(uuid) cascade;

-- Create the correct version with explicit parameter
create or replace function public.diagnose_auth_state(p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := coalesce(p_user_id, auth.uid());
  r jsonb := '{}'::jsonb;
  u_email text;
  u_confirmed boolean;
  p_exists boolean;
  p_first_login boolean;
begin
  -- Check auth.users
  select au.email, (au.email_confirmed_at is not null)
    into u_email, u_confirmed
  from auth.users au
  where au.id = v_user_id;

  -- Check profiles
  select exists(select 1 from public.profiles p where p.id = v_user_id),
         coalesce((select p.first_login_completed from public.profiles p where p.id = v_user_id), false)
    into p_exists, p_first_login;

  -- Build result
  r := r
    || jsonb_build_object('user_id', v_user_id)
    || jsonb_build_object('auth', jsonb_build_object('email', u_email, 'email_confirmed', u_confirmed))
    || jsonb_build_object('profile', jsonb_build_object('exists', p_exists, 'first_login_completed', p_first_login));

  return r;
end;
$$;

-- Ensure admin schema exists and create audit view
create schema if not exists admin;

-- Drop existing view to recreate cleanly  
drop view if exists admin.v_auth_profile_audit;

create view admin.v_auth_profile_audit as
select
  au.id,
  au.email as auth_email,
  au.email_confirmed_at,
  (au.raw_user_meta_data->>'user_type') as auth_user_type,
  p.email as profile_email,
  p.user_type as profile_user_type,
  p.first_login_completed,
  p.email_confirmed
from auth.users au
left join public.profiles p on p.id = au.id;

commit;