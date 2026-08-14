import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import { guardarEmpresa } from "../actions";
import { RUCA_CATEGORIA, HABILITACION_TIPO, provinciaOpciones, type Opcion } from "@/lib/opciones";
import { inputBase } from "@/lib/ui";
import PerfilPublico from "@/components/cuenta/PerfilPublico";

export const metadata: Metadata = {
  title: "Mi empresa | DeCarnes",
  robots: { index: false, follow: false },
};

function Campo({
  label,
  name,
  defaultValue,
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm text-texto-sec">
        {label}
        {required && <span className="text-primario"> *</span>}
      </label>
      <input id={name} name={name} defaultValue={defaultValue ?? ""} required={required} className={inputBase} />
      {hint && <p className="mt-1.5 text-xs text-texto-sec">{hint}</p>}
    </div>
  );
}

function Selector({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: Opcion[];
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm text-texto-sec">{label}</label>
      <select id={name} name={name} defaultValue={defaultValue ?? ""} className={inputBase}>
        <option value="" className="bg-superficie">Elegí una opción</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-superficie">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default async function EmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: u } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="max-w-3xl">
      <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">Mi cuenta</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">Mi empresa</h1>

      <div className="mt-8">
        <PerfilPublico fotoInicial={u?.foto_path ?? null} descripcionInicial={u?.descripcion ?? null} />
      </div>

      <h2 className="mt-12 font-serif text-2xl font-medium text-texto">Datos de la empresa</h2>
      <p className="mt-1 text-sm text-texto-sec">
        Estos datos son internos: los usamos para verificarte y no se muestran en el
        catálogo.
      </p>
      <p className="mt-4 max-w-xl leading-relaxed text-texto-sec">
        Estos datos se usan en tus publicaciones y para que los compradores te
        contacten. No te pedimos documentos todavía.
      </p>

      {error && (
        <p className="mt-6 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">{error}</p>
      )}

      <form action={guardarEmpresa} className="mt-10 space-y-7">
        <div className="grid gap-7 sm:grid-cols-2">
          <Campo label="Razón social" name="razon_social" defaultValue={u?.razon_social ?? u?.empresa} required />
          <Campo label="Nombre de fantasía" name="nombre_fantasia" defaultValue={u?.nombre_fantasia} />
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <Campo label="CUIT" name="cuit" defaultValue={u?.cuit} hint="Viene de tu solicitud; confirmá o corregí." />
          <Campo label="WhatsApp de contacto" name="whatsapp" defaultValue={u?.whatsapp} required hint="Lo usan los compradores para escribirte." />
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <Campo label="Inscripción RUCA · número" name="ruca_numero" defaultValue={u?.ruca_numero} />
          <Selector label="RUCA · categoría" name="ruca_categoria" options={RUCA_CATEGORIA} defaultValue={u?.ruca_categoria} />
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <Selector label="Habilitación sanitaria · tipo" name="habilitacion_tipo" options={HABILITACION_TIPO} defaultValue={u?.habilitacion_tipo} />
          <Campo label="N° de establecimiento" name="habilitacion_numero" defaultValue={u?.habilitacion_numero} />
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <Selector label="Provincia" name="provincia" options={provinciaOpciones} defaultValue={u?.provincia} />
          <Campo label="Localidad" name="localidad" defaultValue={u?.localidad} />
        </div>

        <button type="submit" className="bg-primario px-7 py-3.5 text-base font-medium text-superficie transition-colors hover:bg-primario-hover">
          Guardar datos
        </button>
      </form>
    </div>
  );
}
