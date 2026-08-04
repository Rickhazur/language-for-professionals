-- Bug real encontrado en producción: nada en el código (ni cliente, ni
-- funciones edge, ni triggers) insertaba nunca una fila en
-- student_teacher_assignments. Resultado: "Mis estudiantes" en el panel del
-- profesor siempre estuvo vacío, y el profesor no podía ver el progreso de
-- ningún estudiante aprobado, aunque la aprobación (profiles.is_approved)
-- funcionara bien — son dos mecanismos distintos que nunca se conectaron.
--
-- Este backfill asigna a todos los estudiantes ya aprobados el único
-- profesor que existe hoy en la tabla teacher_profiles. Se protege con un
-- chequeo de "exactamente un profesor" para no asignar mal si en el futuro
-- hay más de uno — en ese caso no hace nada y hay que asignar a mano.
do $$
declare
  teacher_count integer;
  the_teacher_id uuid;
begin
  select count(*) into teacher_count from public.teacher_profiles;

  if teacher_count = 1 then
    select id into the_teacher_id from public.teacher_profiles limit 1;

    insert into public.student_teacher_assignments (student_id, teacher_id)
    select sp.id, the_teacher_id
    from public.student_profiles sp
    join public.profiles p on p.id = sp.id
    where p.is_approved = true
    on conflict (student_id, teacher_id) do nothing;
  end if;
end $$;
