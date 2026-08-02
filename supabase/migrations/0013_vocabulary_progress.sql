-- Progreso de repaso de vocabulario (sistema Leitner simple: 5 cajas, un
-- acierto sube de caja, un error resetea a la caja 1). Como con
-- student_weaknesses/student_gamification/student_badges, la caja y las
-- fechas de repaso las calcula la Edge Function (service role) para que el
-- cliente no pueda auto-reportar su propio progreso — el cliente solo lee.

create table public.student_vocabulary_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  vocabulary_id uuid not null references public.course_plan_vocabulary(id) on delete cascade,
  box smallint not null default 1,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, vocabulary_id)
);

create index student_vocabulary_progress_due_idx on public.student_vocabulary_progress(student_id, next_review_at);

alter table public.student_vocabulary_progress enable row level security;

create policy "Students view own vocabulary progress" on public.student_vocabulary_progress
  for select using (auth.uid() = student_id);

create policy "Assigned teachers view student vocabulary progress" on public.student_vocabulary_progress
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = student_vocabulary_progress.student_id
        and sta.teacher_id = auth.uid()
    )
  );
