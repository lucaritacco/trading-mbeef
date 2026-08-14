import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import AccionesLote from "@/components/cuenta/AccionesLote";
import { formatARS, formatFecha } from "@/lib/panel";

export const metadata: Metadata = {
  title: "Mis lotes | DeCarnes",
  robots: { index: false, follow: false },
};

type Lote = {
  id: string;
  titulo: string | null;
  corte: string | null;
  precio_pretendido_kg: number | null;
  kilos_totales: number | null;
  ubicacion_provincia: string | null;
  publico: boolean | null;
  vendido: boolean | null;
  vendido_at: string | null;
  venta_kg: number | null;
  venta_precio_kg: number | null;
  created_at: string;
  fotos_paths: string[] | null;
};

function estadoDe(l: Lote) {
  if (l.vendido) return { label: "Vendido", clase: "border-exito/50 text-exito" };
  if (l.publico) return { label: "Publicado", clase: "border-primario/40 text-primario" };
  return { label: "Pausado", clase: "border-borde text-texto-sec" };
}

export default async function MisLotesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const supabase = await createSupabaseServer();

  // RLS "lotes own select" limita a los lotes del usuario (user_id = auth.uid()).
  const { data, error } = await supabase
    .from("lotes")
    .select(
      "id, titulo, corte, precio_pretendido_kg, kilos_totales, ubicacion_provincia, publico, vendido, vendido_at, venta_kg, venta_precio_kg, created_at, fotos_paths",
    )
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });
  const lotes = (data ?? []) as Lote[];

  // ¿Puede publicar? Sin verificación la RLS rechaza el alta, así que conviene
  // avisarlo antes y no después de que cargue todo el formulario.
  const { data: est } = await supabase.rpc("mi_estado_cuenta");
  const cuenta = (Array.isArray(est) ? est[0] : null) as
    | { verificado: boolean; rol_mercado: string | null }
    | null;
  const puedePublicar = Boolean(cuenta?.verificado);

  const fotos = new Map<string, string>();
  await Promise.all(
    lotes.map(async (l) => {
      const path = l.fotos_paths?.[0];
      if (!path) return;
      const { data: s } = await supabase.storage.from("lotes-fotos").createSignedUrl(path, 3600);
      if (s?.signedUrl) fotos.set(l.id, s.signedUrl);
    }),
  );

  const activos = lotes.filter((l) => !l.vendido).length;
  const vendidos = lotes.filter((l) => l.vendido).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-primario">Mercado</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">Mis lotes</h1>
          {lotes.length > 0 && (
            <p className="mt-2 text-sm text-texto-sec">
              {activos} en venta · {vendidos} vendido{vendidos === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {puedePublicar && (
          <Link
            href="/cuenta/publicar"
            className="bg-primario px-5 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
          >
            Publicar lote
          </Link>
        )}
      </div>

      {ok === "vendido" && (
        <p className="mt-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
          Lote marcado como vendido. Ya no aparece en el catálogo.
        </p>
      )}
      {ok === "reactivado" && (
        <p className="mt-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
          El lote volvió al catálogo.
        </p>
      )}

      {!puedePublicar && (
        <div className="mt-6 border border-acento bg-acento/10 px-5 py-4">
          <p className="text-sm font-medium text-texto">Tu cuenta está en verificación</p>
          <p className="mt-1 text-sm leading-relaxed text-texto">
            Vamos a revisar tus datos y hablar con vos. Cuando quede verificada vas a
            poder publicar tus lotes y tus publicaciones muestran el sello de
            frigorífico verificado.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-8 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">
          {error.message}
        </p>
      )}

      {lotes.length === 0 ? (
        <div className="mt-12 border border-dashed border-borde px-6 py-14 text-center">
          <p className="font-serif text-lg text-texto">Todavía no publicaste ningún lote</p>
          <p className="mt-1 text-sm text-texto-sec">
            {puedePublicar
              ? "Cargá el primero: corte, kilos, fotos y condiciones."
              : "Vas a poder publicar apenas verifiquemos tu cuenta."}
          </p>
          {puedePublicar && (
            <Link
              href="/cuenta/publicar"
              className="mt-6 inline-block bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
            >
              Publicar mi primer lote
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {lotes.map((l) => {
            const foto = fotos.get(l.id);
            const est = estadoDe(l);
            return (
              <div
                key={l.id}
                className={`flex flex-col gap-4 border p-4 sm:flex-row sm:items-start ${
                  l.vendido ? "border-borde bg-fondo" : "border-borde bg-superficie"
                }`}
              >
                <div className="h-20 w-28 shrink-0 overflow-hidden bg-fondo">
                  {foto && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={foto}
                      alt={l.titulo ?? "Lote"}
                      className={`h-full w-full object-cover ${l.vendido ? "opacity-60" : ""}`}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-lg font-medium text-texto">{l.titulo ?? "—"}</h2>
                    <span className={`border px-2 py-0.5 text-[11px] ${est.clase}`}>{est.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-texto-sec">
                    {[
                      l.corte,
                      l.kilos_totales ? `${l.kilos_totales} kg` : null,
                      l.ubicacion_provincia,
                      l.precio_pretendido_kg ? `${formatARS(l.precio_pretendido_kg)}/kg` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>

                  {l.vendido ? (
                    <p className="mt-1 text-xs text-exito">
                      Vendido el {formatFecha(l.vendido_at)}
                      {l.venta_kg ? ` · ${l.venta_kg} kg` : ""}
                      {l.venta_precio_kg ? ` · ${formatARS(l.venta_precio_kg)}/kg` : ""}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-texto-sec">
                      Creado el {formatFecha(l.created_at)}
                    </p>
                  )}

                  <div className="mt-3">
                    <AccionesLote
                      id={l.id}
                      publico={Boolean(l.publico)}
                      vendido={Boolean(l.vendido)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
