-- Fix and enhance the auth diagnostics function
begin;

-- Drop existing function if it exists (avoid conflicts)
drop function if exists public.diagnose_auth_state(uuid);

-- Create comprehensive auth diagnostics function
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
  u_created_at timestamptz;
  p_exists boolean;
  p_first_login boolean;
  p_created_at timestamptz;
begin
  -- Get auth.users data
  select au.email, 
         (au.email_confirmed_at is not null),
         au.created_at
    into u_email, u_confirmed, u_created_at
  from auth.users au
  where au.id = v_user_id;

  -- Get profile data
  select exists(select 1 from public.profiles p where p.id = v_user_id),
         coalesce((select p.first_login_completed from public.profiles p where p.id = v_user_id), false),
         (select p.created_at from public.profiles p where p.id = v_user_id)
    into p_exists, p_first_login, p_created_at;

  -- Build comprehensive result
  r := r
    || jsonb_build_object('user_id', v_user_id)
    || jsonb_build_object('timestamp', now())
    || jsonb_build_object('auth', jsonb_build_object(
        'email', u_email, 
        'email_confirmed', u_confirmed,
        'created_at', u_created_at,
        'exists', u_email is not null
    ))
    || jsonb_build_object('profile', jsonb_build_object(
        'exists', p_exists, 
        'first_login_completed', p_first_login,
        'created_at', p_created_at
    ))
    || jsonb_build_object('sync_status', jsonb_build_object(
        'auth_profile_match', (u_email is not null and p_exists),
        'potential_orphan_profile', (u_email is null and p_exists),
        'missing_profile', (u_email is not null and not p_exists)
    ));

  return r;
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.diagnose_auth_state(uuid) to authenticated;

commit;