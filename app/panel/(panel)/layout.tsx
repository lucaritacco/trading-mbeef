import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { cerrarSesion } from "../actions";
import PanelNav from "@/components/panel/PanelNav";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/panel/login");

  const { data: esStaff } = await supabase.rpc("is_staff");

  if (!esStaff) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center px-5 text-center">
        <h1 className="font-serif text-3xl font-medium text-hueso">No autorizado</h1>
        <p className="mt-3 max-w-sm text-sm text-taupe">
          Tu usuario ({user.email}) no está habilitado para el panel. Pedile al
          administrador que sume tu email a la lista del equipo.
        </p>
        <form action={cerrarSesion} className="mt-6">
          <button className="border border-hueso/30 px-6 py-3 text-sm text-hueso transition-colors hover:border-hueso/70">
            Cerrar sesión
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-svh">
      <PanelNav email={user.email} />
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
