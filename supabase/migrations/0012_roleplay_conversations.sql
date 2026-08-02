-- Conversaciones de roleplay: usan los escenarios ya generados en
-- course_plan_roleplays (prompt 5/6), personalizados a la ocupación del
-- estudiante — no se inventa un banco de escenarios nuevo.
create table public.roleplay_conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  roleplay_id uuid not null references public.course_plan_roleplays(id) on delete cascade,
  language language_code not null,
  status text not null default 'active', -- 'active' | 'completed'
  feedback text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index roleplay_conversations_student_idx on public.roleplay_conversations(student_id, started_at desc);

create table public.roleplay_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.roleplay_conversations(id) on delete cascade,
  role text not null, -- 'assistant' | 'user'
  content text not null,
  order_index integer not null,
  created_at timestamptz not null default now(),
  unique (conversation_id, order_index)
);

create index roleplay_messages_conversation_idx on public.roleplay_messages(conversation_id, order_index);

alter table public.roleplay_conversations enable row level security;
alter table public.roleplay_messages enable row level security;

-- La Edge Function (service role) crea la conversación y los mensajes; el
-- cliente solo lee, igual que course_plans/course_plan_items.
create policy "Students view own roleplay conversations" on public.roleplay_conversations
  for select using (auth.uid() = student_id);
create policy "Assigned teachers view roleplay conversations" on public.roleplay_conversations
  for select using (
    exists (
      select 1 from public.student_teacher_assignments sta
      where sta.student_id = roleplay_conversations.student_id
        and sta.teacher_id = auth.uid()
    )
  );

create policy "Students view own roleplay messages" on public.roleplay_messages
  for select using (
    exists (
      select 1 from public.roleplay_conversations rc
      where rc.id = roleplay_messages.conversation_id and rc.student_id = auth.uid()
    )
  );
create policy "Assigned teachers view roleplay messages" on public.roleplay_messages
  for select using (
    exists (
      select 1 from public.roleplay_conversations rc
      join public.student_teacher_assignments sta on sta.student_id = rc.student_id
      where rc.id = roleplay_messages.conversation_id and sta.teacher_id = auth.uid()
    )
  );
