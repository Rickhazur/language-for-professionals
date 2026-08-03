-- Cuenta cuántas veces el estudiante ha editado su perfil profesional
-- (ocupación/industria/objetivos) después del onboarding inicial, para
-- poder limitar esa acción a un máximo de 2 ediciones — mismo patrón que
-- MAX_COURSE_PLAN_GENERATIONS en generate-course-plan.
alter table public.student_profiles
  add column profile_edit_count integer not null default 0;
