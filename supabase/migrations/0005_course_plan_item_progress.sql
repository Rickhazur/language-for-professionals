-- course_plan_items solo tenía política de SELECT (el contenido se generaba
-- server-side). Para que el estudiante pueda marcar sus módulos como "en
-- progreso" / "completado" al entrar a cada lección, necesita poder
-- actualizar el status de sus propios módulos.

create policy "Students update own course plan item status" on public.course_plan_items
  for update using (
    exists (
      select 1 from public.course_plans cp
      where cp.id = course_plan_items.course_plan_id
        and cp.student_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.course_plans cp
      where cp.id = course_plan_items.course_plan_id
        and cp.student_id = auth.uid()
    )
  );
