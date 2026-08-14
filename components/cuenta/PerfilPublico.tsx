"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { fotoPerfil } from "@/lib/ficha";
import { MAX_FOTO_BYTES, esImagen, formatearBytes } from "@/lib/validators";

// Perfil público del frigorífico: es lo que ve el comprador en cada lote.
// La foto va al bucket `perfiles` (público) en la carpeta del propio usuario;
// las políticas de storage impiden escribir en la carpeta de otro.
export default function PerfilPublico({
  fotoInicial,
  descripcionInicial,
}: {
  fotoInicial: string | null;
  descripcionInicial: string | null;
}) {
  const router = useRouter();
  const [foto, setFoto] = useState<string | null>(fotoInicial);
  const [descripcion, setDescripcion] = useState(descripcionInicial ?? "");
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function subirFoto(file: File) {
    setError(null);
    if (!esImagen(file)) {
      setError("Tiene que ser una imagen.");
      return;
    }
    if (file.size > MAX_FOTO_BYTES) {
      setError(`La imagen debe pesar menos de ${formatearBytes(MAX_FOTO_BYTES)}.`);
      return;
    }
    setSubiendo(true);
    const supabase = createSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Tu sesión expiró. Volvé a iniciar sesión.");
      setSubiendo(false);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/perfil-${Date.now()}.${ext}`;
    const { error: errUp } = await supabase.storage
      .from("perfiles")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (errUp) {
      setError(`No pudimos subir la foto: ${errUp.message}`);
      setSubiendo(false);
      return;
    }
    const { error: errUpd } = await supabase
      .from("usuarios")
      .update({ foto_path: path })
      .eq("id", user.id);
    if (errUpd) setError(errUpd.message);
    else {
      setFoto(path);
      setOk(true);
      router.refresh();
    }
    setSubiendo(false);
  }

  async function guardarDescripcion() {
    setError(null);
    setGuardando(true);
    const supabase = createSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Tu sesión expiró. Volvé a iniciar sesión.");
      setGuardando(false);
      return;
    }
    const { error: errUpd } = await supabase
      .from("usuarios")
      .update({ descripcion: descripcion.trim() || null })
      .eq("id", user.id);
    if (errUpd) setError(errUpd.message);
    else {
      setOk(true);
      router.refresh();
    }
    setGuardando(false);
  }

  const url = fotoPerfil(foto);

  return (
    <div className="border border-borde bg-superficie p-6 sm:p-7">
      <h2 className="font-serif text-2xl font-medium text-texto">Tu perfil público</h2>
      <p className="mt-1 text-sm leading-relaxed text-texto-sec">
        Esto es lo que ve el comprador en cada lote que publiques y en tu página de
        frigorífico.
      </p>

      {ok && (
        <p className="mt-5 border border-exito/40 bg-exito/10 px-4 py-2.5 text-sm text-exito">
          Perfil actualizado.
        </p>
      )}
      {error && (
        <p className="mt-5 border border-error/40 bg-error-suave px-4 py-2.5 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primario-suave font-serif text-2xl text-primario">
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={url} alt="Tu foto de perfil" className="h-full w-full object-cover" />
          ) : (
            "?"
          )}
        </span>
        <div>
          <label className="inline-block cursor-pointer border border-borde px-5 py-2.5 text-sm text-texto transition-colors hover:border-primario">
            {subiendo ? "Subiendo…" : url ? "Cambiar foto" : "Subir foto"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={subiendo}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void subirFoto(f);
                e.target.value = "";
              }}
            />
          </label>
          <p className="mt-2 text-xs text-texto-sec">
            El logo o el frente de tu planta. Hasta {formatearBytes(MAX_FOTO_BYTES)}.
          </p>
        </div>
      </div>

      <div className="mt-7">
        <label htmlFor="descripcion" className="mb-2 block text-sm text-texto-sec">
          Sobre tu frigorífico
        </label>
        <textarea
          id="descripcion"
          rows={4}
          maxLength={400}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Qué producís, desde cuándo, con qué trabajás. Dos o tres líneas alcanzan."
          className="w-full border border-borde bg-superficie px-4 py-3 text-sm text-texto placeholder:text-texto-sec/60 outline-none transition-colors focus:border-primario"
        />
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-xs text-texto-sec">{descripcion.length}/400</span>
          <button
            type="button"
            onClick={guardarDescripcion}
            disabled={guardando}
            className="bg-primario px-5 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar descripción"}
          </button>
        </div>
      </div>
    </div>
  );
}
