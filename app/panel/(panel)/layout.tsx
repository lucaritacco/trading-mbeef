import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { cerrarSesion } from "../actions";

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
      <header className="sticky top-0 z-40 border-b border-hueso/10 bg-carbon/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/panel" className="font-serif text-xl font-semibold tracking-[0.06em] text-hueso">
              DECARNES
              <span className="ml-2 align-middle text-[10px] uppercase tracking-[0.25em] text-taupe">Mesa</span>
            </Link>
            <nav className="hidden items-center gap-5 text-sm text-taupe sm:flex">
              <Link href="/panel" className="transition-colors hover:text-hueso">Lotes</Link>
              <Link href="/panel/config" className="transition-colors hover:text-hueso">Configuración</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-taupe md:inline">{user.email}</span>
            <form action={cerrarSesion}>
              <button className="text-sm text-taupe transition-colors hover:text-hueso">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
