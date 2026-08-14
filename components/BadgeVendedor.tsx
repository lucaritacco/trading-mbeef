import Link from "next/link";
import { fotoPerfil } from "@/lib/ficha";

// Identidad del frigorífico dueño del lote: foto, nombre y sello de verificado.
// Es lo que convierte un lote anónimo en "esto lo publica alguien que responde".
export default function BadgeVendedor({
  id,
  nombre,
  foto,
  verificado,
  tamano = "sm",
  conLink = true,
}: {
  id: string | null;
  nombre: string | null;
  foto: string | null;
  verificado: boolean;
  tamano?: "sm" | "md";
  conLink?: boolean;
}) {
  if (!nombre) return null;

  const url = fotoPerfil(foto);
  const md = tamano === "md";
  const avatar = md ? "h-10 w-10" : "h-7 w-7";

  const contenido = (
    <>
      <span
        className={`${avatar} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primario-suave text-xs font-semibold uppercase text-primario`}
      >
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          nombre.charAt(0)
        )}
      </span>
      <span className="min-w-0">
        <span
          className={`flex items-center gap-1 truncate font-medium text-texto ${md ? "text-base" : "text-sm"}`}
        >
          {nombre}
          {verificado && (
            <svg
              viewBox="0 0 24 24"
              className={md ? "h-4 w-4 shrink-0 text-exito" : "h-3.5 w-3.5 shrink-0 text-exito"}
              fill="currentColor"
              aria-label="Frigorífico verificado"
            >
              <path d="M12 1.5l2.6 2 3.2-.3 1 3.1 2.7 1.8-1.3 3 1.3 3-2.7 1.8-1 3.1-3.2-.3-2.6 2-2.6-2-3.2.3-1-3.1L2.5 15l1.3-3-1.3-3 2.7-1.8 1-3.1 3.2.3zM10.9 15.4l5.3-5.3-1.4-1.4-3.9 3.9-1.8-1.8-1.4 1.4z" />
            </svg>
          )}
        </span>
        {md && (
          <span className="block text-xs text-texto-sec">
            {verificado ? "Frigorífico verificado" : "Frigorífico"}
          </span>
        )}
      </span>
    </>
  );

  if (!conLink || !id) {
    return <span className="flex items-center gap-2">{contenido}</span>;
  }

  return (
    <Link
      href={`/vendedor/${id}`}
      className="flex items-center gap-2 transition-opacity hover:opacity-75"
    >
      {contenido}
    </Link>
  );
}
