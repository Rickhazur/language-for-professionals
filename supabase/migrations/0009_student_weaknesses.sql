-- "Debilidades activas": patrones de error recurrentes detectados a partir
-- de shadowing_phoneme_scores (por ahora solo fonemas; weakness_type deja
-- espacio para otros tipos más adelante sin rediseñar la tabla). Una sola
-- fila por (estudiante, idioma, tipo, fonema) que se reactiva/resuelve con
-- el tiempo en vez de acumular un log de eventos — "activa" solo tiene
-- sentido si también puede dejar de estarlo.

create table public.student_weaknesses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  language language_code not null,
  weakness_type text not null default 'phoneme',
  target text not null, -- símbolo IPA del fonema, ej. "θ"
  sample_count integer not null,
  average_score numeric(5, 2) not null,
  is_active boolean not null default true,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (student_id, language, weakness_type, target)
);

create index student_weaknesses_active_idx on public.student_weaknesses(student_id, is_active);

alter table public.student_weaknesses enable row level security;

-- Las calcula la Edge Function (service role) tras cada análisis de
-- pronunciación; el cliente y los profesores asignados solo leen.
create policy "Students view own weaknesses" on public.student_weaknesses
  for select using (auth.uid() = student_id);

create policy "Assigned teachers view student weaknesses" on public.student_weaknesses
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = student_weaknesses.student_id
        and sta.teacher_id = auth.uid()
    )
  );
