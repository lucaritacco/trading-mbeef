import { createSupabaseServer } from "@/lib/supabase/server";
import { actualizarConfig } from "../../actions";
import { CONFIG_DEFAULT, type Config } from "@/lib/panel";
import { inputBase } from "@/lib/ui";

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("config").select("*").maybeSingle();
  const config: Config = data ?? CONFIG_DEFAULT;

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-3xl font-medium text-texto">Configuración</h1>
      <p className="mt-1 text-sm text-texto-sec">Umbrales del semáforo y tasa para el contado equivalente.</p>

      {ok && (
        <p className="mt-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
          Guardado.
        </p>
      )}

      <form action={actualizarConfig} className="mt-8 space-y-6">
        <div>
          <label htmlFor="umbral_pasar" className="mb-2 block text-sm text-texto-sec">
            Umbral “pasar” (%) <span className="text-texto-sec">— margen por debajo: pasar</span>
          </label>
          <input id="umbral_pasar" name="umbral_pasar" type="number" step="0.1" inputMode="decimal" defaultValue={config.umbral_pasar} className={inputBase} required />
        </div>
        <div>
          <label htmlFor="umbral_comision" className="mb-2 block text-sm text-texto-sec">
            Umbral “comisión” (%) <span className="text-texto-sec">— hasta este valor: comisión; por encima: compra en firme</span>
          </label>
          <input id="umbral_comision" name="umbral_comision" type="number" step="0.1" inputMode="decimal" defaultValue={config.umbral_comision} className={inputBase} required />
        </div>
        <div>
          <label htmlFor="tasa_anual" className="mb-2 block text-sm text-texto-sec">
            Tasa anual (%) <span className="text-texto-sec">— para el contado equivalente</span>
          </label>
          <input id="tasa_anual" name="tasa_anual" type="number" step="0.1" inputMode="decimal" defaultValue={config.tasa_anual} className={inputBase} required />
        </div>
        <button type="submit" className="bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover">
          Guardar configuración
        </button>
      </form>
    </div>
  );
}
