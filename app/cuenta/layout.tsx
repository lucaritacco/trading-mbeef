import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { cerrarSesionUsuario } from "./actions";

export default async function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Solo es "usuario de beta" quien tiene fila en `usuarios` (su propia fila por RLS).
  // El staff y los registros sin invitación canjeada NO tienen fila → sin acceso.
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("empresa")
    .eq("id", user.id)
    .maybeSingle();

  if (!usuario) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center px-5 text-center">
        <h1 className="font-serif text-3xl font-medium text-hueso">Sin acceso al mercado</h1>
        <p className="mt-3 max-w-sm text-sm text-taupe">
          Esta cuenta ({user.email}) no tiene acceso al mercado de DeCarnes. El
          acceso es por invitación, una vez aprobada tu solicitud.
        </p>
        <form action={cerrarSesionUsuario} className="mt-6">
          <button className="border border-hueso/30 px-6 py-3 text-sm text-hueso transition-colors hover:border-hueso/70">
            Cerrar sesión
          </button>
        </form>
      </main>
    );
  }

  const links = [
    { href: "/cuenta/mercado", label: "Mercado" },
    { href: "/cuenta/mis-lotes", label: "Mis lotes" },
    { href: "/cuenta/publicar", label: "Publicar lote" },
    { href: "/cuenta/empresa", label: "Mi empresa" },
  ];

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b border-hueso/10 bg-carbon/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/cuenta" className="font-serif text-xl font-semibold tracking-[0.06em] text-hueso">
              DECARNES
            </Link>
            <nav className="hidden items-center gap-5 text-sm text-taupe md:flex">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="transition-colors hover:text-hueso">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-taupe lg:inline">{usuario.empresa ?? user.email}</span>
            <form action={cerrarSesionUsuario}>
              <button className="text-sm text-taupe transition-colors hover:text-hueso">Salir</button>
            </form>
          </div>
        </div>
        {/* Nav en celular: fila desplazable */}
        <nav className="flex gap-4 overflow-x-auto border-t border-hueso/10 px-5 py-3 text-sm text-taupe md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap transition-colors hover:text-hueso">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
