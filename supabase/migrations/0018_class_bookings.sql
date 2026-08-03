-- Agendar clases en vivo: el estudiante propone una fecha/hora y la función
-- book-class (service role) revisa disponibilidad y reserva — el cliente
-- nunca ve el horario completo del profesor, solo un sí/no por intento.

create table public.teacher_availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=domingo .. 6=sábado
  start_time time not null,
  end_time time not null
);

create table public.class_bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Bloquea reservas dobles a nivel de base de datos (a prueba de condición de
-- carrera): si dos estudiantes reservan la misma hora al mismo tiempo, uno
-- de los dos falla en el insert — no hace falta lógica de "revisar y luego
-- insertar" en la función.
create unique index class_bookings_teacher_time_idx
  on public.class_bookings(teacher_id, scheduled_at) where status = 'confirmed';

create index class_bookings_student_idx on public.class_bookings(student_id, scheduled_at);

-- Lunes a sábado, 8am-8pm (hora Colombia), para cada profesor ya existente.
insert into public.teacher_availability (teacher_id, day_of_week, start_time, end_time)
select p.id, d, '08:00', '20:00'
from public.profiles p, unnest(array[1, 2, 3, 4, 5, 6]) as d
where p.role = 'teacher';

alter table public.teacher_availability enable row level security;
alter table public.class_bookings enable row level security;

-- El horario en sí no se expone a estudiantes (todo el punto de esto es que
-- el cliente nunca vea el calendario completo) — solo el propio profesor
-- puede leer su horario, para una futura pantalla de configuración.
create policy "Teachers view own availability" on public.teacher_availability
  for select using (auth.uid() = teacher_id);

-- Reservas: cada quien ve las suyas. Las escrituras son solo por service
-- role (desde book-class), no hay política de insert directo — así un
-- estudiante no puede insertar saltándose la revisión de disponibilidad.
create policy "Students view own bookings" on public.class_bookings
  for select using (auth.uid() = student_id);
create policy "Teachers view own bookings" on public.class_bookings
  for select using (auth.uid() = teacher_id);
