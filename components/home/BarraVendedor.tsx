import Link from "next/link";

// Barra de acción para vendedores logueados. Solo se renderiza con sesión:
// para el visitante anónimo la home no muestra nada de esto.
export default function BarraVendedor() {
  return (
    <div className="border-b border-hueso/10 bg-bordo/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <p className="text-sm text-hueso">
          <span className="font-medium">Publicá lo que tenés hoy.</span>{" "}
          <span className="text-taupe">Tu stock, visible para compradores de todo el país.</span>
        </p>
        <Link
          href="/cuenta/publicar"
          className="bg-bordo px-5 py-2.5 text-sm font-medium text-hueso transition-colors hover:bg-rojo"
        >
          Publicar lote
        </Link>
      </div>
    </div>
  );
}
