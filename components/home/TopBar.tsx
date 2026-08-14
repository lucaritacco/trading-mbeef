import Link from "next/link";

// Barra fina sobre el header: fija el qué es (claim) y deja el acceso del
// vendedor siempre a mano, sin robarle lugar al nav del comprador.
export default function TopBar() {
  return (
    <div className="bg-tinta text-superficie">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <p className="text-[10px] uppercase tracking-[0.22em] text-superficie/85 sm:text-[11px]">
          Marketplace B2B de carne en Argentina
        </p>
        <Link
          href="/vendedores"
          className="hidden text-[11px] text-superficie/80 transition-colors hover:text-superficie sm:inline"
        >
          ¿Sos frigorífico? Publicá tu stock →
        </Link>
      </div>
    </div>
  );
}
