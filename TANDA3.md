# TANDA 3 · Login de usuarios de la beta

Da acceso con cuenta propia a los usuarios **aprobados** de la beta, separado del
staff. Termina en una pantalla `/cuenta` protegida y vacía (esqueleto para la
tanda 4). Reutiliza el Supabase Auth que ya existe — **no se agregó otro sistema
de auth**.

---

## Mecanismo elegido: invitación por token (opción a) — y por qué

Cuando el staff aprueba una solicitud, ésta queda con un **token de invitación**
(uuid, de un solo uso). El staff copia el **enlace de registro** (que aparece en
`/panel/solicitudes` para las aprobadas) y se lo manda a la persona **por el mismo
WhatsApp** con el que ya avisa la aprobación. La persona abre el enlace, crea su
cuenta, y al "canjear" el token se crea su perfil en `usuarios`. **Sin un token
aprobado y sin usar, no hay cuenta funcional.**

Por qué esta opción y no "registrarse con el email de la solicitud" (opción b):
- En `solicitudes_beta` el campo de contacto es **"WhatsApp o email"**: muchas
  solicitudes no tienen email, así que gatear por email sería poco confiable.
- **No hay SMTP** configurado, así que no podemos verificar emails ni mandar
  magic links de forma confiable.
- El token es una llave **inadivinable y de un solo uso**, válida **solo si la
  solicitud está `aprobada`**. Encaja con el flujo manual por WhatsApp que ya usa
  el equipo.
- Evita meter la **service_role key** (que saltea todo el RLS) dentro de la web:
  todo el control queda en RLS + funciones versionadas y auditables, con el menor
  "radio de daño" posible si algo se filtrara.

Garantía: alguien NO aprobado, aunque cree un usuario de Auth, **no obtiene fila
en `usuarios`** → no puede entrar a `/cuenta` ni leer ningún dato. Su cuenta queda
inerte.

---

## ⚠️ 1) Migración a correr (vos, a mano)

Supabase → **SQL Editor** → **New query** → pegar TODO → **Run**. Aditiva, no
borra nada. (Versionada en `supabase/migrations/0007_usuarios.sql` y reflejada en
`supabase/schema.sql`.)

```sql
alter table public.solicitudes_beta
  add column if not exists invitacion_token uuid not null default gen_random_uuid(),
  add column if not exists invitacion_usada boolean not null default false;
create unique index if not exists solicitudes_beta_token_idx
  on public.solicitudes_beta (invitacion_token);

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  solicitud_id uuid references public.solicitudes_beta(id),
  empresa text, cuit text, rol_mercado text,
  estado text not null default 'activo'
);
alter table public.usuarios enable row level security;

drop policy if exists "usuarios own select" on public.usuarios;
create policy "usuarios own select" on public.usuarios
  for select to authenticated using (id = auth.uid());
drop policy if exists "usuarios own update" on public.usuarios;
create policy "usuarios own update" on public.usuarios
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "usuarios staff select" on public.usuarios;
create policy "usuarios staff select" on public.usuarios
  for select to authenticated using (public.is_staff());

create or replace function public.validar_invitacion(p_token uuid)
returns table (valido boolean, empresa text)
language sql security definer set search_path = public stable as $$
  select true, s.empresa from public.solicitudes_beta s
  where s.invitacion_token = p_token and s.estado = 'aprobada' and s.invitacion_usada = false
  limit 1;
$$;
revoke all on function public.validar_invitacion(uuid) from public;
grant execute on function public.validar_invitacion(uuid) to anon, authenticated;

create or replace function public.canjear_invitacion(p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.usuarios where id = auth.uid()) then return true; end if;
  select * into s from public.solicitudes_beta
    where invitacion_token = p_token and estado = 'aprobada' and invitacion_usada = false
    for update;
  if not found then return false; end if;
  insert into public.usuarios (id, solicitud_id, empresa, cuit, rol_mercado)
    values (auth.uid(), s.id, s.empresa, s.cuit, s.rol);
  update public.solicitudes_beta set invitacion_usada = true where id = s.id;
  return true;
end; $$;
revoke all on function public.canjear_invitacion(uuid) from public;
grant execute on function public.canjear_invitacion(uuid) to authenticated;
```

## ⚠️ 2) Dos settings de Supabase Auth (Authentication → Sign In / Providers → Email)

- **Allow new users to sign up: ACTIVADO.** El registro de la beta usa el alta
  normal de Supabase. (Seguro: una cuenta sin invitación canjeada queda inerte,
  sin acceso a `/cuenta` ni a datos, porque todo está protegido por RLS.)
- **Confirm email: DESACTIVADO.** No hay SMTP, así que no se puede confirmar por
  mail. El token de invitación es la verificación real. (Si más adelante
  configurás SMTP, se puede volver a activar.)

> Esto NO afecta al staff: siguen logueándose con sus usuarios creados a mano en
> el dashboard, y `is_staff()` sigue siendo por email en la tabla `staff`.

## 3) Recuperar contraseña

`/recuperar` usa el flujo estándar (`resetPasswordForEmail`) y `/actualizar-clave`
setea la nueva. **Requiere SMTP** en Supabase para que llegue el mail. Mientras
no haya SMTP, el equipo puede resetear la clave de un usuario desde el dashboard
(Authentication → Users). Queda armado para cuando se configure SMTP.

---

## Qué se construyó (rutas)

- **`/login`** — ingreso de usuarios de beta (email + contraseña).
- **`/registro?token=…`** — solo funciona con un token de invitación **aprobado**;
  sin token válido muestra "Invitación no válida".
- **`/recuperar`** y **`/actualizar-clave`** — recuperación de contraseña estándar.
- **`/cuenta`** — protegida. Si no estás logueado → `/login`. Si estás logueado
  pero **no tenés fila en `usuarios`** (staff, o registro sin canjear) → "Sin
  acceso al mercado" + cerrar sesión. Si sos usuario de beta → "Hola, [empresa]"
  + placeholder "Acá vas a ver y publicar lotes (próximamente)".
- **`/panel/solicitudes`** — para las aprobadas, muestra el **enlace de invitación**
  a copiar y mandar por WhatsApp. (`/panel` y el login de staff quedaron intactos.)

Separación de espacios: `/panel` = staff (gateado por `is_staff()`); `/cuenta` =
usuarios de beta (gateado por tener fila en `usuarios`). Son ortogonales.

---

## CHECKLIST DE SEGURIDAD (cómo está resuelto y cómo probarlo)

1. **Un email NO aprobado no puede crear cuenta funcional.**
   - Cómo: el registro exige un token válido; el perfil `usuarios` se crea SOLO
     vía `canjear_invitacion`, que verifica solicitud `aprobada` + token sin usar.
   - Probar: entrá a `/registro` sin token o con uno inventado → "Invitación no
     válida", no hay formulario. Aunque alguien cree un usuario de Auth suelto,
     `/cuenta` lo manda a "Sin acceso al mercado".

2. **Usuario de beta NO entra a `/panel` ni a datos de staff.**
   - Cómo: el layout de `/panel` exige `is_staff()` (email en `staff`); un usuario
     de beta no está → pantalla "No autorizado". Todo el RLS de staff usa
     `is_staff()`.
   - Probar: logueado como usuario de beta, andá a `/panel` → "No autorizado".

3. **Un usuario de beta NO lee el perfil/datos de otro.**
   - Cómo: RLS de `usuarios` → `select` solo `id = auth.uid()` (o staff). No hay
     política que permita ver filas ajenas.
   - Probar: con dos cuentas distintas (dos invitaciones), cada una en `/cuenta`
     ve solo su empresa. En el SQL Editor podés confirmar las dos filas; desde la
     app, una no puede leer la otra.

4. **El login de staff sigue igual.**
   - Cómo: no se tocó `/panel/login`, ni el layout de `/panel`, ni `is_staff()`,
     ni las RLS existentes. El middleware conserva la lógica de `/panel` idéntica
     y solo **agrega** la de `/cuenta`.
   - Probar: entrá al panel con tu usuario de staff como siempre.

5. **Cerrar sesión funciona y deja la ruta protegida inaccesible.**
   - Cómo: `cerrarSesionUsuario` hace `signOut` y manda a `/login`; el middleware
     bloquea `/cuenta` sin sesión.
   - Probar: en `/cuenta` → Salir → volvé a `/cuenta` → te manda a `/login`.

6. **anon (sin login) no accede a `/cuenta` ni lee `usuarios`.**
   - Cómo: middleware redirige `/cuenta` → `/login` sin sesión; `usuarios` no tiene
     ninguna política para `anon` (RLS bloquea toda lectura anónima).
   - Probar: en una ventana privada (sin login), abrí `/cuenta` → vas a `/login`.

## Cómo probar el flujo completo (después de la migración + settings)

1. En `/panel/solicitudes`, aprobá una solicitud → aparece su **enlace de
   invitación**. Copialo.
2. Abrí ese enlace (`/registro?token=…`) en una ventana privada → creá la cuenta
   (email + contraseña).
3. Caés en `/cuenta` con "Hola, [empresa]". Cerrá sesión y volvé a entrar por
   `/login`.
4. Reabrí el mismo enlace de invitación → ya no es válido (token de un solo uso).

## Criterios de aceptación
- ✅ Supabase Auth reutilizado, sin segundo sistema.
- ✅ Solo aprobados (con token canjeado) tienen cuenta funcional.
- ✅ Separación staff / usuario de beta verificable en ambos sentidos.
- ✅ `/cuenta` protegida y vacía (esqueleto tanda 4).
- ✅ Migración + mecanismo justificado + checklist de seguridad (este archivo).
