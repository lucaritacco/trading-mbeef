import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Preferencia de avisos | DeCarnes",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Entidad = { tipo: "usuario" | "suscriptor"; nombre: string | null; recibe: boolean };

// Resuelve el token: puede ser de un usuario de beta (avisos_token) o de un
// suscriptor liviano (baja_token). Devuelve el estado normalizado.
async function resolver(token: string): Promise<Entidad | null> {
  if (!UUID_RE.test(token)) return null;
  const admin = createSupabaseAdmin();
  if (!admin) return null;

  const { data: u } = await admin
    .from("usuarios")
    .select("empresa, recibir_avisos")
    .eq("avisos_token", token)
    .maybeSingle();
  if (u) return { tipo: "usuario", nombre: u.empresa, recibe: u.recibir_avisos };

  const { data: s } = await admin
    .from("suscriptores")
    .select("nombre, baja")
    .eq("baja_token", token)
    .maybeSingle();
  if (s) return { tipo: "suscriptor", nombre: s.nombre, recibe: !s.baja };

  return null;
}

// Solo cambia al enviar el formulario (no en un GET), para que ningún prefetch de
// correo dé de baja sin intención del usuario.
async function cambiarAvisos(formData: FormData): Promise<void> {
  "use server";
  const token = String(formData.get("token") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const recibir = formData.get("recibir") === "true";
  if (UUID_RE.test(token)) {
    const admin = createSupabaseAdmin();
    if (admin) {
      if (tipo === "usuario") {
        await admin.from("usuarios").update({ recibir_avisos: recibir }).eq("avisos_token", token);
      } else if (tipo === "suscriptor") {
        await admin.from("suscriptores").update({ baja: !recibir }).eq("baja_token", token);
      }
    }
  }
  redirect(`/avisos?token=${token}&ok=1`);
}

export default async function AvisosPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; ok?: string }>;
}) {
  const { token, ok } = await searchParams;
  const ent = token ? await resolver(token) : null;

  return (
    <div className="min-h-svh bg-superficie text-texto">
      <header className="border-b border-borde">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-serif text-xl font-semibold tracking-[0.07em] text-texto">
            DECARNES
          </Link>
          <span className="text-[10px] uppercase tracking-[0.28em] text-texto-sec">
            Carne argentina · MBEEF
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">Avisos por email</p>
        <h1 className="mt-3 font-serif text-3xl font-medium text-texto sm:text-4xl">
          Preferencia de avisos
        </h1>

        {!ent ? (
          <p className="mt-6 leading-relaxed text-texto-sec">
            El enlace no es válido o expiró. Si querés volver a recibir los lotes nuevos,
            suscribite en{" "}
            <Link href="/compradores" className="text-primario hover:text-texto">/compradores</Link>.
          </p>
        ) : (
          <div className="mt-8 border border-borde bg-fondo p-7">
            {ok && (
              <p className="mb-5 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
                Preferencia actualizada.
              </p>
            )}
            <p className="text-texto">
              {ent.nombre ? <span className="font-medium">{ent.nombre}</span> : "Tu email"}
              {ent.recibe ? (
                <> está recibiendo avisos de <strong>lotes nuevos</strong>.</>
              ) : (
                <> <strong>no</strong> está recibiendo avisos de lotes nuevos.</>
              )}
            </p>

            <form action={cambiarAvisos} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="tipo" value={ent.tipo} />
              <input type="hidden" name="recibir" value={ent.recibe ? "false" : "true"} />
              {ent.recibe ? (
                <button className="bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover">
                  Darme de baja de estos avisos
                </button>
              ) : (
                <button className="border border-exito/40 px-6 py-3 text-sm font-medium text-exito transition-colors hover:bg-exito/10">
                  Volver a recibir avisos
                </button>
              )}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
