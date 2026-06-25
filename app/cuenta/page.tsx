import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import { rolLabel } from "@/lib/beta";

export const metadata: Metadata = {
  title: "Mi cuenta | DeCarnes",
  robots: { index: false, follow: false },
};

export default async function CuentaPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("empresa, rol_mercado")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Mi cuenta</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">
        Hola{usuario?.empresa ? `, ${usuario.empresa}` : ""}.
      </h1>
      {usuario?.rol_mercado && (
        <p className="mt-2 text-sm text-taupe">
          Perfil: {rolLabel(usuario.rol_mercado)}
        </p>
      )}

      <div className="mt-10 border border-dashed border-hueso/20 p-8 text-center">
        <p className="font-serif text-2xl font-medium text-hueso">
          Acá vas a ver y publicar lotes
        </p>
        <p className="mt-2 text-sm text-taupe">(próximamente)</p>
      </div>
    </div>
  );
}
