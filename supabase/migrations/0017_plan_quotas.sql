-- Paquetes con cupo de sesiones de práctica en la app (Diagnostic / Momentum
-- / Full Program / Ongoing, del plan de ventas). Cada práctica completada
-- (roleplay, módulo de lección, shadowing) cuenta contra el cupo total y
-- semanal del plan asignado. Sin plan asignado = sin límite (mismo criterio
-- que el rollout de is_approved: no bloquear cuentas existentes de golpe).

create table public.plans (
  id text primary key,
  name text not null,
  total_sessions integer,
  weekly_session_limit integer,
  duration_weeks integer,
  created_at timestamptz not null default now()
);

insert into public.plans (id, name, total_sessions, weekly_session_limit, duration_weeks) values
  ('diagnostic', 'Diagnostic', 0, 0, null),
  ('momentum', 'Momentum', 15, 3, 5),
  ('full_program', 'Full Program', 30, 3, 10),
  ('ongoing', 'Ongoing', null, 3, null);

-- Plan activo de cada estudiante. started_at ancla los bloques semanales;
-- solo un plan activo por estudiante a la vez (asignar uno nuevo desactiva
-- el anterior, lo que reinicia ambos contadores).
create table public.student_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.plans(id),
  started_at timestamptz not null default now(),
  is_active boolean not null default true,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create unique index student_plans_one_active_per_student
  on public.student_plans(student_id) where is_active;

-- Una fila por cada práctica completada que cuenta contra el cupo.
create table public.app_usage_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_plan_id uuid not null references public.student_plans(id) on delete cascade,
  session_type text not null check (session_type in ('roleplay', 'lesson', 'shadowing')),
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;
alter table public.student_plans enable row level security;
alter table public.app_usage_log enable row level security;

-- plans: son datos de referencia de precios, cualquier usuario autenticado
-- los puede leer.
create policy "Authenticated users read plans" on public.plans
  for select using (auth.role() = 'authenticated');

-- student_plans: el estudiante ve el suyo; el profesor asignado ve los de
-- sus estudiantes. Las escrituras son solo por service role (se hacen desde
-- la función assign-student-plan) — no hay política de insert/update para
-- estudiantes ni profesores, así que no existe riesgo de auto-asignación
-- equivalente al que motivó prevent_self_approval.
create policy "Students view own plan" on public.student_plans
  for select using (auth.uid() = student_id);
create policy "Teachers view assigned students' plans" on public.student_plans
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = student_plans.student_id and sta.teacher_id = auth.uid()
    )
  );

-- app_usage_log: misma visibilidad, solo lectura para ambos roles.
create policy "Students view own usage" on public.app_usage_log
  for select using (auth.uid() = student_id);
create policy "Teachers view assigned students' usage" on public.app_usage_log
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = app_usage_log.student_id and sta.teacher_id = auth.uid()
    )
  );
