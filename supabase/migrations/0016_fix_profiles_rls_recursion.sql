-- 0015's "Approved teachers view pending profiles" policy queries
-- public.profiles from within a policy defined ON public.profiles, which
-- Postgres evaluates recursively (every SELECT on profiles re-triggers the
-- same policy) -- "infinite recursion detected in policy for relation
-- profiles", breaking ALL reads on profiles for every user, not just this
-- feature. Standard fix: move the cross-referential check into a
-- SECURITY DEFINER function, which (as the function owner) bypasses RLS on
-- its own internal query instead of re-entering policy evaluation.

create or replace function public.is_approved_teacher(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'teacher' and is_approved = true
  );
$$;

drop policy if exists "Approved teachers view pending profiles" on public.profiles;

create policy "Approved teachers view pending profiles" on public.profiles
  for select using (
    is_approved = false and public.is_approved_teacher(auth.uid())
  );
