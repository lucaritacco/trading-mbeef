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

// Cambia la preferencia. Solo ocurre al enviar el formulario (no en un GET),
// para que ningún prefetch de correo dé de baja sin intención del usuario.
async function cambiarAvisos(formData: FormData): Promise<void> {
  "use server";
  const token = String(formData.get("token") ?? "");
  const recibir = formData.get("recibir") === "true";
  if (UUID_RE.test(token)) {
    const admin = createSupabaseAdmin();
    if (admin) {
      await admin.from("usuarios").update({ recibir_avisos: recibir }).eq("avisos_token", token);
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

  let usuario: { empresa: string | null; recibir_avisos: boolean } | null = null;
  if (token && UUID_RE.test(token)) {
    const admin = createSupabaseAdmin();
    if (admin) {
      const { data } = await admin
        .from("usuarios")
        .select("empresa, recibir_avisos")
        .eq("avisos_token", token)
        .maybeSingle();
      usuario = data;
    }
  }

  return (
    <div className="min-h-svh">
      <header className="border-b border-hueso/10">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-serif text-xl font-semibold tracking-[0.07em] text-hueso">
            DECARNES
          </Link>
          <span className="text-[10px] uppercase tracking-[0.28em] text-taupe">
            Carne argentina · MBEEF
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Avisos por email</p>
        <h1 className="mt-3 font-serif text-3xl font-medium text-hueso sm:text-4xl">
          Preferencia de avisos
        </h1>

        {!usuario ? (
          <p className="mt-6 leading-relaxed text-taupe">
            El enlace no es válido o expiró. Si querés cambiar tus avisos, entrá a{" "}
            <Link href="/cuenta" className="text-salmon hover:text-hueso">tu cuenta</Link>.
          </p>
        ) : (
          <div className="mt-8 border border-hueso/15 bg-carbon/40 p-7">
            {ok && (
              <p className="mb-5 border border-verde-claro/40 bg-verde/15 px-4 py-3 text-sm text-verde-claro">
                Preferencia actualizada.
              </p>
            )}
            <p className="text-hueso">
              {usuario.empresa ? <span className="font-medium">{usuario.empresa}</span> : "Tu cuenta"}
              {usuario.recibir_avisos ? (
                <> está recibiendo avisos de <strong>lotes nuevos</strong>.</>
              ) : (
                <> <strong>no</strong> está recibiendo avisos de lotes nuevos.</>
              )}
            </p>

            <form action={cambiarAvisos} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="recibir" value={usuario.recibir_avisos ? "false" : "true"} />
              {usuario.recibir_avisos ? (
                <button className="bg-bordo px-6 py-3 text-sm font-medium text-hueso transition-colors hover:bg-rojo">
                  Darme de baja de estos avisos
                </button>
              ) : (
                <button className="border border-verde-claro/50 px-6 py-3 text-sm font-medium text-verde-claro transition-colors hover:bg-verde/20">
                  Volver a recibir avisos
                </button>
              )}
            </form>

            <p className="mt-5 text-xs text-taupe/70">
              Los avisos transaccionales (consultas a tus lotes, aprobación de cuenta) se
              envían igual; esto controla solo los avisos de lotes nuevos del mercado.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
