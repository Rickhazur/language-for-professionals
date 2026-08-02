-- Contenido generado del plan de curso: vocabulario profesional y escenarios
-- de roleplay, normalizados para poder consultarlos/practicarlos por separado
-- (no solo como bloque de texto dentro de course_plans).

create table public.course_plan_vocabulary (
  id uuid primary key default uuid_generate_v4(),
  course_plan_id uuid not null references public.course_plans(id) on delete cascade,
  term text not null,
  translation text not null,
  example_sentence text,
  created_at timestamptz not null default now()
);

create index course_plan_vocabulary_plan_idx on public.course_plan_vocabulary(course_plan_id);

create table public.course_plan_roleplays (
  id uuid primary key default uuid_generate_v4(),
  course_plan_id uuid not null references public.course_plans(id) on delete cascade,
  title text not null,
  context text not null,
  objective text not null,
  related_objective text not null, -- meetings | emails | negotiation | presentations | customer_service | travel
  difficulty cefr_level not null,
  created_at timestamptz not null default now()
);

create index course_plan_roleplays_plan_idx on public.course_plan_roleplays(course_plan_id);

-- ── RLS ───────────────────────────────────────────────────────────────────
-- Mismo patrón que course_plan_items: contenido generado server-side (service
-- role desde la Edge Function), el cliente solo necesita SELECT.
alter table public.course_plan_vocabulary enable row level security;
alter table public.course_plan_roleplays enable row level security;

create policy "Students view own course plan vocabulary" on public.course_plan_vocabulary
  for select using (
    exists (
      select 1 from public.course_plans cp
      where cp.id = course_plan_vocabulary.course_plan_id
        and cp.student_id = auth.uid()
    )
  );
create policy "Assigned teachers view course plan vocabulary" on public.course_plan_vocabulary
  for select using (
    exists (
      select 1 from public.course_plans cp
      join public.student_teacher_assignments sta on sta.student_id = cp.student_id
      where cp.id = course_plan_vocabulary.course_plan_id
        and sta.teacher_id = auth.uid()
    )
  );

create policy "Students view own course plan roleplays" on public.course_plan_roleplays
  for select using (
    exists (
      select 1 from public.course_plans cp
      where cp.id = course_plan_roleplays.course_plan_id
        and cp.student_id = auth.uid()
    )
  );
create policy "Assigned teachers view course plan roleplays" on public.course_plan_roleplays
  for select using (
    exists (
      select 1 from public.course_plans cp
      join public.student_teacher_assignments sta on sta.student_id = cp.student_id
      where cp.id = course_plan_roleplays.course_plan_id
        and sta.teacher_id = auth.uid()
    )
  );
