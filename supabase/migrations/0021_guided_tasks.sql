-- "Seguir instrucciones": una segunda modalidad dentro de Roleplay, además
-- de la conversación libre que ya existe. La IA le da al estudiante una
-- tarea dividida en pasos (relevante a su profesión, igual que el resto del
-- plan de curso); el estudiante responde cada paso y la IA juzga si lo
-- cumplió. Reutiliza course_plan_roleplays en vez de crear un banco de
-- escenarios aparte — un escenario ahora puede ser 'conversation' (como
-- antes) o 'guided_task' (con una lista de pasos).
alter table public.course_plan_roleplays
  add column activity_type text not null default 'conversation'
    check (activity_type in ('conversation', 'guided_task')),
  add column steps jsonb;

create table public.guided_task_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  roleplay_id uuid not null references public.course_plan_roleplays(id) on delete cascade,
  language language_code not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  current_step integer not null default 0,
  -- Un objeto por paso ya respondido: { step_index, instruction, response, correct, feedback }
  step_results jsonb not null default '[]'::jsonb,
  total_steps integer not null,
  score integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index guided_task_attempts_student_idx on public.guided_task_attempts(student_id, started_at desc);

alter table public.guided_task_attempts enable row level security;

-- La Edge Function (service role) crea/actualiza el intento; el cliente
-- solo lee, mismo patrón que roleplay_conversations.
create policy "Students view own guided task attempts" on public.guided_task_attempts
  for select using (auth.uid() = student_id);
create policy "Assigned teachers view guided task attempts" on public.guided_task_attempts
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = guided_task_attempts.student_id
        and sta.teacher_id = auth.uid()
    )
  );
