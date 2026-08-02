-- El panel del profesor necesita leer datos del estudiante que hasta ahora
-- nadie más que el propio estudiante podía ver: nombre/email (profiles),
-- datos de perfil (student_profiles), y sus sesiones de práctica
-- (practice_sessions — la política vieja de 0001 solo dejaba ver sesiones
-- donde teacher_id coincidiera exacto, pero el shadowing nunca asigna un
-- profesor a la sesión). Se agregan como políticas nuevas vía
-- student_teacher_assignments, sin tocar las que ya existían.

create policy "Assigned teachers view student profile" on public.profiles
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = profiles.id
        and sta.teacher_id = auth.uid()
    )
  );

create policy "Assigned teachers view student_profiles" on public.student_profiles
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = student_profiles.id
        and sta.teacher_id = auth.uid()
    )
  );

create policy "Assigned teachers view practice sessions via assignment" on public.practice_sessions
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = practice_sessions.student_id
        and sta.teacher_id = auth.uid()
    )
  );

-- ── Resumen de IA por estudiante (para el panel del profesor) ───────────
create table public.student_ai_summaries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  summary text not null,
  generated_at timestamptz not null default now()
);

create index student_ai_summaries_student_idx on public.student_ai_summaries(student_id, generated_at desc);

alter table public.student_ai_summaries enable row level security;

-- Lo genera la Edge Function (service role); el cliente solo lee.
create policy "Assigned teachers view ai summaries" on public.student_ai_summaries
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = student_ai_summaries.student_id
        and sta.teacher_id = auth.uid()
    )
  );
