-- Flujo de aprobación de cuentas: todo registro nuevo (estudiante o profesor)
-- queda pendiente hasta que un profesor ya aprobado lo apruebe desde el
-- panel. Se agrega a "profiles" (no a las tablas de rol específicas) porque
-- aplica igual a ambos roles y es lo primero que se consulta al iniciar
-- sesión.

alter table public.profiles add column is_approved boolean not null default false;
alter table public.profiles add column approved_at timestamptz;

-- Deja aprobadas todas las cuentas existentes (incluyendo la del profesor
-- actual) para que este cambio no bloquee a nadie que ya estaba usando la app.
update public.profiles set is_approved = true, approved_at = now();

-- Defensa extra: la política "Users can update own profile" ya deja que
-- cualquier usuario actualice su propia fila (así es como se guarda el rol
-- elegido al registrarse hoy). Sin este trigger, esa misma política dejaría
-- que un estudiante se auto-apruebe con un simple UPDATE desde el cliente.
-- Fuerza is_approved/approved_at a su valor anterior en cualquier escritura
-- que no venga del service role.
create or replace function public.prevent_self_approval()
returns trigger as $$
begin
  if auth.role() <> 'service_role' then
    new.is_approved := old.is_approved;
    new.approved_at := old.approved_at;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger prevent_self_approval before update on public.profiles
  for each row execute function public.prevent_self_approval();

-- Un profesor necesita ver las cuentas pendientes para poder aprobarlas,
-- pero la política existente de SELECT solo cubre la propia fila. Las
-- políticas permisivas se combinan con OR, así que esto suma visibilidad
-- sobre filas pendientes sin tocar la política ya existente.
create policy "Approved teachers view pending profiles" on public.profiles
  for select using (
    is_approved = false
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.is_approved = true
    )
  );
