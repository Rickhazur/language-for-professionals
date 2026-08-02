-- Extiende el esquema inicial: tipado más estricto (enums), perfil profesional,
-- relación profesor-estudiante, evaluaciones de nivel, planes de curso generados,
-- sesiones de shadowing con puntaje por fonema, y notas del profesor.

-- ── Tipos enumerados ─────────────────────────────────────────────────────
create type language_code as enum ('en', 'es');
create type cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
create type skill_type as enum ('listening', 'speaking', 'reading', 'writing', 'vocabulary', 'grammar');
create type practice_session_type as enum ('self_practice', 'live_class', 'assessment', 'shadowing');
create type course_plan_status as enum ('active', 'completed', 'archived');
create type course_plan_item_status as enum ('not_started', 'in_progress', 'completed');

-- ── student_profiles: idiomas tipados + perfil profesional ─────────────────
alter table public.student_profiles drop column if exists profession;
alter table public.student_profiles drop column if exists learning_goals;

alter table public.student_profiles
  add column occupation text,
  add column industry text,
  add column learning_objectives text[] not null default '{}';

alter table public.student_profiles alter column native_language drop default;
alter table public.student_profiles
  alter column native_language type language_code using native_language::language_code;
alter table public.student_profiles alter column native_language set default 'es';

alter table public.student_profiles alter column target_language drop default;
alter table public.student_profiles
  alter column target_language type language_code using target_language::language_code;
alter table public.student_profiles alter column target_language set default 'en';

-- 'beginner'/'intermediate'/'advanced' -> escala CEFR
alter table public.student_profiles alter column proficiency_level drop default;
alter table public.student_profiles
  alter column proficiency_level type cefr_level using (
    case proficiency_level
      when 'beginner' then 'A1'
      when 'intermediate' then 'B1'
      when 'advanced' then 'C1'
      else 'A1'
    end
  )::cefr_level;
alter table public.student_profiles alter column proficiency_level set default 'A1';

-- ── progress: idioma/skill/nivel tipados ────────────────────────────────
alter table public.progress
  alter column language type language_code using language::language_code,
  alter column skill type skill_type using skill::skill_type;

alter table public.progress alter column level drop default;
alter table public.progress
  alter column level type cefr_level using (
    case level
      when 'beginner' then 'A1'
      when 'intermediate' then 'B1'
      when 'advanced' then 'C1'
      else 'A1'
    end
  )::cefr_level;
alter table public.progress alter column level set default 'A1';

-- ── practice_sessions: idioma tipado + nuevo tipo 'shadowing' ───────────
alter table public.practice_sessions
  alter column language type language_code using language::language_code,
  alter column session_type type practice_session_type using session_type::practice_session_type;

-- ── Relación profesor-estudiante (necesaria para notas, planes y RLS) ───
create table public.student_teacher_assignments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (student_id, teacher_id)
);

create index student_teacher_assignments_teacher_idx on public.student_teacher_assignments(teacher_id);

-- ── Evaluaciones de nivel ────────────────────────────────────────────────
create table public.level_assessments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  teacher_id uuid references public.teacher_profiles(id) on delete set null,
  language language_code not null,
  overall_level cefr_level not null,
  listening_score numeric(5, 2),
  speaking_score numeric(5, 2),
  reading_score numeric(5, 2),
  writing_score numeric(5, 2),
  vocabulary_score numeric(5, 2),
  grammar_score numeric(5, 2),
  notes text,
  taken_at timestamptz not null default now()
);

create index level_assessments_student_idx on public.level_assessments(student_id, taken_at desc);

-- ── Plan de curso generado ───────────────────────────────────────────────
create table public.course_plans (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  language language_code not null,
  level_at_generation cefr_level not null,
  status course_plan_status not null default 'active',
  title text not null,
  summary text,
  generated_by text not null default 'ai', -- 'ai' | 'teacher'
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un solo plan activo por estudiante e idioma a la vez
create unique index course_plans_one_active_per_student_language
  on public.course_plans(student_id, language)
  where status = 'active';

create trigger set_updated_at before update on public.course_plans
  for each row execute function public.set_updated_at();

create table public.course_plan_items (
  id uuid primary key default uuid_generate_v4(),
  course_plan_id uuid not null references public.course_plans(id) on delete cascade,
  order_index integer not null,
  title text not null,
  description text,
  skill_focus skill_type,
  estimated_minutes integer,
  status course_plan_item_status not null default 'not_started',
  created_at timestamptz not null default now(),
  unique (course_plan_id, order_index)
);

create index course_plan_items_plan_idx on public.course_plan_items(course_plan_id, order_index);

-- ── Shadowing: puntaje de pronunciación por fonema ──────────────────────
-- Cada fila es un intento de shadowing (practice_sessions.session_type = 'shadowing');
-- el detalle fonema por fonema cuelga de esa sesión.
create table public.shadowing_phoneme_scores (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  phoneme text not null,
  word text,
  accuracy_score numeric(5, 2) not null,
  attempt_number integer not null default 1,
  created_at timestamptz not null default now()
);

create index shadowing_phoneme_scores_session_idx on public.shadowing_phoneme_scores(session_id);

-- ── Notas del profesor por estudiante (privadas, no visibles al estudiante) ─
create table public.teacher_notes (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teacher_notes_teacher_student_idx on public.teacher_notes(teacher_id, student_id);

create trigger set_updated_at before update on public.teacher_notes
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────
alter table public.student_teacher_assignments enable row level security;
alter table public.level_assessments enable row level security;
alter table public.course_plans enable row level security;
alter table public.course_plan_items enable row level security;
alter table public.shadowing_phoneme_scores enable row level security;
alter table public.teacher_notes enable row level security;

-- student_teacher_assignments: ambas partes pueden ver/crear/eliminar el vínculo
create policy "Participants view own assignments" on public.student_teacher_assignments
  for select using (auth.uid() = student_id or auth.uid() = teacher_id);
create policy "Participants create assignments" on public.student_teacher_assignments
  for insert with check (auth.uid() = student_id or auth.uid() = teacher_id);
create policy "Participants remove assignments" on public.student_teacher_assignments
  for delete using (auth.uid() = student_id or auth.uid() = teacher_id);

-- level_assessments: el estudiante ve/crea las suyas; el profesor asignado solo las ve
create policy "Students manage own assessments" on public.level_assessments
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "Assigned teachers view assessments" on public.level_assessments
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = level_assessments.student_id
        and sta.teacher_id = auth.uid()
    )
  );

-- course_plans / course_plan_items: generados por el sistema (service role);
-- el cliente solo necesita SELECT.
create policy "Students view own course plans" on public.course_plans
  for select using (auth.uid() = student_id);
create policy "Assigned teachers view course plans" on public.course_plans
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = course_plans.student_id
        and sta.teacher_id = auth.uid()
    )
  );

create policy "Students view own course plan items" on public.course_plan_items
  for select using (
    exists (
      select 1 from public.course_plans cp
      where cp.id = course_plan_items.course_plan_id
        and cp.student_id = auth.uid()
    )
  );
create policy "Assigned teachers view course plan items" on public.course_plan_items
  for select using (
    exists (
      select 1 from public.course_plans cp
      join public.student_teacher_assignments sta on sta.student_id = cp.student_id
      where cp.id = course_plan_items.course_plan_id
        and sta.teacher_id = auth.uid()
    )
  );

-- shadowing_phoneme_scores: sigue el mismo dueño que la sesión de práctica
create policy "Students manage own phoneme scores" on public.shadowing_phoneme_scores
  for all using (
    exists (
      select 1 from public.practice_sessions ps
      where ps.id = shadowing_phoneme_scores.session_id
        and ps.student_id = auth.uid()
    )
  );
create policy "Assigned teachers view phoneme scores" on public.shadowing_phoneme_scores
  for select using (
    exists (
      select 1 from public.practice_sessions ps
      join public.student_teacher_assignments sta on sta.student_id = ps.student_id
      where ps.id = shadowing_phoneme_scores.session_id
        and sta.teacher_id = auth.uid()
    )
  );

-- teacher_notes: solo el profesor autor las ve y edita (privadas frente al estudiante)
create policy "Teachers manage own notes" on public.teacher_notes
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
