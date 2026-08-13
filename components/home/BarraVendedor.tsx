import Link from "next/link";

// Barra de acción para vendedores logueados. Solo se renderiza con sesión:
// para el visitante anónimo la home no muestra nada de esto.
// Es el único elemento en ámbar de la pantalla (regla: uno por pantalla), y el
// texto va en carbón porque blanco sobre ámbar no llega a AA.
export default function BarraVendedor() {
  return (
    <div className="border-b border-borde bg-acento">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <p className="text-sm text-texto">
          <span className="font-semibold">Publicá lo que tenés hoy.</span>{" "}
          <span className="text-texto/75">Tu stock, visible para compradores de todo el país.</span>
        </p>
        <Link
          href="/cuenta/publicar"
          className="border border-texto/25 bg-texto px-5 py-2.5 text-sm font-medium text-acento transition-colors hover:bg-texto/85"
        >
          Publicar lote
        </Link>
      </div>
    </div>
  );
}
