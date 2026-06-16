import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { actualizarComprador, borrarComprador } from "../../../actions";
import CompradorFields from "@/components/panel/CompradorFields";
import type { Comprador } from "@/lib/panel";

export default async function CompradorDetalle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServer();

  const { data } = await supabase.from("compradores").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const c = data as Comprador;

  return (
    <div className="max-w-3xl">
      <Link href="/panel/compradores" className="text-sm text-taupe transition-colors hover:text-hueso">← Volver a compradores</Link>
      <h1 className="mt-4 font-serif text-3xl font-medium text-hueso">{c.nombre}</h1>

      {error === "nombre" && (
        <p className="mt-6 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">El nombre es obligatorio.</p>
      )}
      {error && error !== "nombre" && (
        <p className="mt-6 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">{error}</p>
      )}

      <form action={actualizarComprador} className="mt-8 space-y-5">
        <input type="hidden" name="id" value={c.id} />
        <CompradorFields c={c} />
        <div className="flex items-center justify-between pt-2">
          <button type="submit" className="bg-bordo px-6 py-3 text-sm font-medium text-hueso transition-colors hover:bg-rojo">
            Guardar cambios
          </button>
        </div>
      </form>

      <form action={borrarComprador} className="mt-10 border-t border-hueso/10 pt-6">
        <input type="hidden" name="id" value={c.id} />
        <button type="submit" className="text-sm text-taupe transition-colors hover:text-rojo-claro">
          Eliminar comprador
        </button>
      </form>
    </div>
  );
}
