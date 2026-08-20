/**
 * Cambia el email de un usuario: login Y avisos a la vez.
 *
 * Todas las funciones de notificación (emails_frigorificos,
 * emails_usuarios_activos, frigorificos_para_activar, email_dueno_lote)
 * sacan la dirección de auth.users.email, así que cambiarla acá alcanza.
 *
 * Se usa la Admin API y no un UPDATE a mano sobre auth.users porque la API
 * actualiza también la fila de `identities`. Si eso queda desincronizado,
 * el usuario no puede volver a iniciar sesión.
 *
 *   node --env-file=.env.local scripts/cambiar-email.mjs viejo@mail.com nuevo@mail.com
 */
import { createClient } from "@supabase/supabase-js";

const [viejo, nuevo] = process.argv.slice(2);
if (!viejo || !nuevo) {
  console.error("Uso: node --env-file=.env.local scripts/cambiar-email.mjs <viejo> <nuevo>");
  process.exit(1);
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local (Supabase → Settings → API).");
  process.exit(1);
}

const admin = createClient(URL, KEY, { auth: { persistSession: false } });

// Buscar al usuario. listUsers pagina de a 50 por defecto.
let usuario = null;
for (let page = 1; page <= 20 && !usuario; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error("Error listando usuarios:", error.message); process.exit(1); }
  if (data.users.length === 0) break;
  usuario = data.users.find((u) => (u.email ?? "").toLowerCase() === viejo.toLowerCase()) ?? null;
}

if (!usuario) { console.error(`No hay ningún usuario con el email ${viejo}.`); process.exit(1); }

console.log(`Usuario ${usuario.id}`);
console.log(`  de:  ${usuario.email}`);
console.log(`  a:   ${nuevo}`);

// email_confirm evita que quede pendiente de verificar y sin poder entrar.
const { error } = await admin.auth.admin.updateUserById(usuario.id, {
  email: nuevo,
  email_confirm: true,
});
if (error) { console.error("No se pudo cambiar:", error.message); process.exit(1); }

console.log("\nListo. Con esa dirección inicia sesión y recibe los avisos.");
console.log("La contraseña no cambió.");
