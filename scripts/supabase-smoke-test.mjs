// Prueba mínima de conexión a Supabase: guarda una fila y la vuelve a leer.
// Correr con:  npm run supabase:test
// (usa --env-file=.env.local para leer las credenciales)

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "✗ Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "  Asegurate de tener .env.local y de correr con: npm run supabase:test",
  );
  process.exit(1);
}

const supabase = createClient(url, key);
const stamp = new Date().toISOString();

// 1) GUARDA + LEE en connection_test
const { data: guardado, error: errIns } = await supabase
  .from("connection_test")
  .insert({ mensaje: `smoke-test ${stamp}` })
  .select()
  .single();

if (errIns) {
  console.error("✗ No se pudo guardar en connection_test:", errIns.message);
  console.error("  ¿Pegaste y corriste el SQL de supabase/migrations/0001_init.sql?");
  process.exit(1);
}
console.log("✓ Guardado en connection_test  (id:", guardado.id + ")");

const { data: leido, error: errSel } = await supabase
  .from("connection_test")
  .select("id, mensaje, created_at")
  .eq("id", guardado.id)
  .single();

if (errSel) {
  console.error("✗ No se pudo leer de connection_test:", errSel.message);
  process.exit(1);
}
console.log("✓ Leído de connection_test    :", leido.mensaje);

// 2) INSERT en la tabla real "lotes" (anon solo escribe; se verifica en el panel)
const { error: errLote } = await supabase
  .from("lotes")
  .insert({
    razon_social: `PRUEBA ${stamp}`,
    declaracion_jurada: true,
    estado: "nuevo",
  });

if (errLote) {
  console.error("✗ No se pudo insertar en lotes:", errLote.message);
  process.exit(1);
}
console.log("✓ Insertado un lote de prueba  (verificá en el panel → Table editor → lotes)");

console.log("\n✅ Todo OK: la conexión a Supabase guarda y lee datos.");
