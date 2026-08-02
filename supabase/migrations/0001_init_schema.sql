-- Esquema inicial: usuarios, perfiles de estudiante/profesor, progreso y sesiones de práctica

create extension if not exists "uuid-ossp";

create type user_role as enum ('student', 'teacher');

-- profiles: 1:1 con auth.users (Supabase ya gestiona la tabla de auth, no la duplicamos)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  native_language text not null default 'es',
  target_language text not null default 'en',
  proficiency_level text not null default 'beginner',
  profession text,
  learning_goals text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  specialties text[],
  years_experience integer,
  languages_taught text[] not null default array['en', 'es'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  language text not null,
  skill text not null, -- listening | speaking | reading | writing | vocabulary | grammar
  level text not null default 'beginner',
  score numeric(5, 2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (student_id, language, skill)
);

create table public.practice_sessions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  teacher_id uuid references public.teacher_profiles(id) on delete set null,
  language text not null,
  session_type text not null, -- self_practice | live_class | assessment
  duration_minutes integer,
  score numeric(5, 2),
  notes text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Mantiene updated_at al día en cada UPDATE
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.student_profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.teacher_profiles
  for each row execute function public.set_updated_at();

-- Crea automáticamente la fila en profiles cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: cada usuario solo ve/edita sus propios datos
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.progress enable row level security;
alter table public.practice_sessions enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Students manage own student profile" on public.student_profiles
  for all using (auth.uid() = id);

create policy "Teachers manage own teacher profile" on public.teacher_profiles
  for all using (auth.uid() = id);

create policy "Students manage own progress" on public.progress
  for all using (auth.uid() = student_id);

create policy "Students manage own sessions" on public.practice_sessions
  for all using (auth.uid() = student_id);
create policy "Teachers view assigned sessions" on public.practice_sessions
  for select using (auth.uid() = teacher_id);
