-- Contenido dinámico por módulo de curso: cada módulo (course_plan_items)
-- ahora puede tener una lección real generada por IA en vez del placeholder
-- estático. El contenido se genera UNA vez por módulo (cache) y lo escribe
-- exclusivamente la Edge Function (service role) — igual que
-- student_vocabulary_progress, el cliente solo lee.

-- Vocabulario: caso especial, no usa course_plan_item_content. Un módulo de
-- vocabulario simplemente etiqueta términos existentes de
-- course_plan_vocabulary a su módulo (nullable: el vocabulario "general" del
-- plan, no ligado a ningún módulo específico, sigue siendo válido).
alter table public.course_plan_vocabulary
  add column course_plan_item_id uuid references public.course_plan_items(id) on delete set null;

create table public.course_plan_item_content (
  id uuid primary key default gen_random_uuid(),
  course_plan_item_id uuid not null unique references public.course_plan_items(id) on delete cascade,
  content jsonb not null,
  generated_at timestamptz not null default now()
);

alter table public.course_plan_item_content enable row level security;

create policy "Students view own lesson content" on public.course_plan_item_content
  for select using (
    exists (
      select 1 from public.course_plan_items cpi
      join public.course_plans cp on cp.id = cpi.course_plan_id
      where cpi.id = course_plan_item_content.course_plan_item_id
        and cp.student_id = auth.uid()
    )
  );

create policy "Assigned teachers view lesson content" on public.course_plan_item_content
  for select using (
    exists (
      select 1 from public.course_plan_items cpi
      join public.course_plans cp on cp.id = cpi.course_plan_id
      join public.student_teacher_assignments sta on sta.student_id = cp.student_id
      where cpi.id = course_plan_item_content.course_plan_item_id
        and sta.teacher_id = auth.uid()
    )
  );

create table public.course_plan_item_attempts (
  id uuid primary key default gen_random_uuid(),
  course_plan_item_id uuid not null references public.course_plan_items(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  score numeric(5, 2), -- null para writing/speaking (writing = feedback cualitativo, speaking ya se califica vía shadowing_attempts)
  responses jsonb not null default '{}'::jsonb, -- quiz: respuestas seleccionadas; writing: texto del estudiante + feedback de la IA
  completed_at timestamptz not null default now()
);

create index course_plan_item_attempts_student_idx on public.course_plan_item_attempts(student_id, completed_at desc);

alter table public.course_plan_item_attempts enable row level security;

create policy "Students view own lesson attempts" on public.course_plan_item_attempts
  for select using (auth.uid() = student_id);

create policy "Assigned teachers view student lesson attempts" on public.course_plan_item_attempts
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = course_plan_item_attempts.student_id
        and sta.teacher_id = auth.uid()
    )
  );
