-- Marca si el estudiante ya completó el onboarding (idiomas + perfil profesional),
-- para que la app sepa cuándo mostrar ese flujo en vez de la app principal.

alter table public.student_profiles
  add column onboarding_completed boolean not null default false;
