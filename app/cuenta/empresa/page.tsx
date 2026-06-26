import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import { guardarEmpresa } from "../actions";
import { RUCA_CATEGORIA, HABILITACION_TIPO, provinciaOpciones, type Opcion } from "@/lib/opciones";
import { inputBase } from "@/lib/ui";

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
      <label htmlFor={name} className="mb-2 block text-sm text-taupe">
        {label}
        {required && <span className="text-bordo"> *</span>}
      </label>
      <input id={name} name={name} defaultValue={defaultValue ?? ""} required={required} className={inputBase} />
      {hint && <p className="mt-1.5 text-xs text-taupe/60">{hint}</p>}
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
      <label htmlFor={name} className="mb-2 block text-sm text-taupe">{label}</label>
      <select id={name} name={name} defaultValue={defaultValue ?? ""} className={inputBase}>
        <option value="" className="bg-carbon">Elegí una opción</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-carbon">{o.label}</option>
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
      <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Mi cuenta</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">Datos de mi empresa</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-taupe">
        Estos datos se usan en tus publicaciones y para que los compradores te
        contacten. No te pedimos documentos todavía.
      </p>

      {error && (
        <p className="mt-6 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">{error}</p>
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

        <button type="submit" className="bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo">
          Guardar datos
        </button>
      </form>
    </div>
  );
}
