-- Rachas diarias + puntos: un estado actual por estudiante (no un log de
-- eventos), recalculado por las Edge Functions cada vez que hay actividad
-- real (terminar una sesión de práctica, analizar una grabación).
create table public.student_gamification (
  student_id uuid primary key references public.student_profiles(id) on delete cascade,
  total_points integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now()
);

alter table public.student_gamification enable row level security;

create policy "Students view own gamification state" on public.student_gamification
  for select using (auth.uid() = student_id);
create policy "Assigned teachers view student gamification state" on public.student_gamification
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = student_gamification.student_id
        and sta.teacher_id = auth.uid()
    )
  );

-- Insignias: catálogo pequeño y fijo (rachas, puntos) más insignias de
-- dominio de fonema, que son dinámicas por fonema — por eso título/
-- descripción/ícono se guardan directo en la fila en vez de tener una tabla
-- catálogo aparte para un puñado de definiciones conocidas en el código.
create table public.student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  badge_type text not null, -- 'streak' | 'points' | 'phoneme_mastery'
  badge_key text not null,  -- ej. 'streak_7', 'points_100', o el fonema 'θ'
  title text not null,
  description text not null,
  icon text not null default '🏅',
  awarded_at timestamptz not null default now(),
  unique (student_id, badge_type, badge_key)
);

create index student_badges_student_idx on public.student_badges(student_id, awarded_at desc);

alter table public.student_badges enable row level security;

create policy "Students view own badges" on public.student_badges
  for select using (auth.uid() = student_id);
create policy "Assigned teachers view student badges" on public.student_badges
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = student_badges.student_id
        and sta.teacher_id = auth.uid()
    )
  );
