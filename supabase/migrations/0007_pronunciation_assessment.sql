-- Reemplaza shadowing_phoneme_scores (creada en 0002 como suposición, nunca
-- usada con datos reales) por un esquema que sí coincide con la forma real
-- de la respuesta de Azure Pronunciation Assessment: un intento de shadowing
-- (shadowing_attempts) con puntajes generales de la oración, y el desglose
-- por palabra y por fonema en tablas hijas.

drop table if exists public.shadowing_phoneme_scores;

create table public.shadowing_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.practice_sessions(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  language language_code not null,
  reference_text text not null,
  recognized_text text,
  accuracy_score numeric(5, 2),
  fluency_score numeric(5, 2),
  prosody_score numeric(5, 2),
  completeness_score numeric(5, 2),
  pron_score numeric(5, 2), -- puntaje general ponderado que calcula Azure
  created_at timestamptz not null default now()
);

create index shadowing_attempts_student_idx on public.shadowing_attempts(student_id, created_at desc);
create index shadowing_attempts_session_idx on public.shadowing_attempts(session_id);

create table public.shadowing_word_scores (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.shadowing_attempts(id) on delete cascade,
  order_index integer not null,
  word text not null,
  accuracy_score numeric(5, 2),
  error_type text, -- None | Omission | Insertion | Mispronunciation | UnexpectedBreak | MissingBreak | Monotone
  created_at timestamptz not null default now()
);

create index shadowing_word_scores_attempt_idx on public.shadowing_word_scores(attempt_id, order_index);

create table public.shadowing_phoneme_scores (
  id uuid primary key default gen_random_uuid(),
  word_score_id uuid not null references public.shadowing_word_scores(id) on delete cascade,
  order_index integer not null,
  phoneme text not null, -- símbolo IPA
  accuracy_score numeric(5, 2),
  created_at timestamptz not null default now()
);

create index shadowing_phoneme_scores_word_idx on public.shadowing_phoneme_scores(word_score_id, order_index);

-- ── Storage privado para el audio grabado por el estudiante ────────────────
-- A diferencia de reference-audio (público, voz sintética), esto es la voz
-- real del estudiante: bucket privado, cada quien solo accede a su carpeta.
-- La Edge Function borra el archivo apenas termina de analizarlo.
insert into storage.buckets (id, name, public)
values ('shadowing-recordings', 'shadowing-recordings', false)
on conflict (id) do nothing;

create policy "Students manage own recordings" on storage.objects
  for all using (
    bucket_id = 'shadowing-recordings' and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'shadowing-recordings' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table public.shadowing_attempts enable row level security;
alter table public.shadowing_word_scores enable row level security;
alter table public.shadowing_phoneme_scores enable row level security;

-- Los intentos los crea la Edge Function (service role) tras analizar el
-- audio; el cliente solo necesita leerlos.
create policy "Students view own shadowing attempts" on public.shadowing_attempts
  for select using (auth.uid() = student_id);
create policy "Assigned teachers view shadowing attempts" on public.shadowing_attempts
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = shadowing_attempts.student_id
        and sta.teacher_id = auth.uid()
    )
  );

create policy "Students view own word scores" on public.shadowing_word_scores
  for select using (
    exists (
      select 1 from public.shadowing_attempts sa
      where sa.id = shadowing_word_scores.attempt_id and sa.student_id = auth.uid()
    )
  );
create policy "Assigned teachers view word scores" on public.shadowing_word_scores
  for select using (
    exists (
      select 1 from public.shadowing_attempts sa
      join public.student_teacher_assignments sta on sta.student_id = sa.student_id
      where sa.id = shadowing_word_scores.attempt_id and sta.teacher_id = auth.uid()
    )
  );

create policy "Students view own phoneme scores" on public.shadowing_phoneme_scores
  for select using (
    exists (
      select 1 from public.shadowing_word_scores sws
      join public.shadowing_attempts sa on sa.id = sws.attempt_id
      where sws.id = shadowing_phoneme_scores.word_score_id and sa.student_id = auth.uid()
    )
  );
create policy "Assigned teachers view phoneme scores" on public.shadowing_phoneme_scores
  for select using (
    exists (
      select 1 from public.shadowing_word_scores sws
      join public.shadowing_attempts sa on sa.id = sws.attempt_id
      join public.student_teacher_assignments sta on sta.student_id = sa.student_id
      where sws.id = shadowing_phoneme_scores.word_score_id and sta.teacher_id = auth.uid()
    )
  );
