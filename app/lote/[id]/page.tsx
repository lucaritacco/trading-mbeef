import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFicha, firmarFoto, type FichaPublica } from "@/lib/ficha";
import { createSupabaseServer } from "@/lib/supabase/server";
import ConsultaLote from "@/components/ficha/ConsultaLote";
import {
  TIPO_PRODUCTO,
  LOTE_ESTADO,
  ENVASADO,
  MODALIDAD_ENTREGA,
  labelDe,
} from "@/lib/opciones";
import { formatFecha, formatARS } from "@/lib/panel";

function nombreLote(f: { titulo: string | null; tipo_producto: string | null }): string {
  return f.titulo || labelDe(TIPO_PRODUCTO, f.tipo_producto) || "Lote de carne";
}

function tituloLote(f: {
  titulo: string | null;
  tipo_producto: string | null;
  kilos_totales: number | null;
  ubicacion_provincia: string | null;
}): string {
  const partes = [
    nombreLote(f),
    f.kilos_totales ? `${f.kilos_totales} kg` : null,
    f.ubicacion_provincia,
  ].filter(Boolean);
  return `${partes.join(" · ")} — DeCarnes`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const f = await getFicha(id);
  if (!f) return { title: "Lote no disponible — DeCarnes", robots: { index: false } };

  const titulo = tituloLote(f);
  const cortes = [...(f.cortes ?? []), f.cortes_otro].filter(Boolean).join(", ");
  const descripcion =
    [labelDe(TIPO_PRODUCTO, f.tipo_producto), f.especie_categoria, cortes]
      .filter(Boolean)
      .join(" · ") || "Carne vacuna. Consultá condiciones por WhatsApp.";

  const ogPath = f.fotos_paths?.[0];
  const ogUrl = ogPath ? await firmarFoto(ogPath) : null;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      type: "website",
      images: ogUrl ? [{ url: ogUrl }] : [],
    },
  };
}

// Un dato de la grilla técnica: etiqueta chica arriba, valor abajo. Si el lote no
// tiene el dato cargado, en vez de vacío muestra una invitación tenue a consultarlo.
function Dato({
  label,
  value,
  consulta,
}: {
  label: string;
  value: React.ReactNode;
  consulta: string;
}) {
  const cargado = value !== null && value !== undefined && value !== "";
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">{label}</dt>
      <dd className="mt-1 text-sm">
        {cargado ? (
          <span className="text-hueso">{value}</span>
        ) : (
          <span className="italic text-taupe/45">{consulta}</span>
        )}
      </dd>
    </div>
  );
}

export default async function FichaPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const f: FichaPublica | null = await getFicha(id);
  if (!f) notFound();

  // Estado de sesión: decide si los botones consultan (logueado) o mandan a login (anónimo).
  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const logueado = Boolean(user);

  const fotos = (
    await Promise.all((f.fotos_paths ?? []).map((p) => firmarFoto(p)))
  ).filter((u): u is string => Boolean(u));

  const cortes = [...(f.cortes ?? []), f.cortes_otro].filter(Boolean).join(", ");
  const corteVal = f.corte || cortes || labelDe(TIPO_PRODUCTO, f.tipo_producto);
  const especie = f.especie_categoria;
  const packaging = [labelDe(ENVASADO, f.envasado_tipo), f.envasado_marca]
    .filter(Boolean)
    .join(" · ");
  const certificados = (f.certificados ?? []).join(", ");
  const ubicacion = [f.ubicacion_localidad, f.ubicacion_provincia]
    .filter(Boolean)
    .join(", ");

  const ref = f.id.slice(0, 8).toUpperCase();

  const datos: { label: string; value: React.ReactNode; consulta: string }[] = [
    { label: "Corte / artículo", value: corteVal, consulta: "Consultá el corte" },
    { label: "Especie / categoría", value: especie, consulta: "Consultá la categoría" },
    { label: "Kilos totales", value: f.kilos_totales ? `${f.kilos_totales} kg` : null, consulta: "Consultá los kilos" },
    { label: "Piezas / cajas", value: f.piezas_cajas, consulta: "Consultá las piezas/cajas" },
    { label: "Compra mínima", value: f.moq ? `${f.moq} kg` : null, consulta: "Consultá la cantidad mínima" },
    { label: "Precio por kg", value: f.precio_pretendido_kg ? formatARS(f.precio_pretendido_kg) : null, consulta: "Consultá el precio" },
    { label: "Estado", value: labelDe(LOTE_ESTADO, f.lote_estado), consulta: "Consultá el estado" },
    { label: "Envasado", value: packaging, consulta: "Consultá el packaging" },
    { label: "Entrega", value: labelDe(MODALIDAD_ENTREGA, f.modalidad_entrega), consulta: "Consultá la modalidad de entrega" },
    { label: "Certificados", value: certificados, consulta: "Consultá los certificados" },
    { label: "Faena", value: f.fecha_faena ? formatFecha(f.fecha_faena) : null, consulta: "Consultá la fecha de faena" },
    { label: "Vencimiento", value: f.fecha_vencimiento ? formatFecha(f.fecha_vencimiento) : null, consulta: "Consultá el vencimiento" },
    { label: "Ubicación", value: ubicacion, consulta: "Consultá la ubicación" },
  ];

  return (
    <div className="min-h-svh">
      <header className="border-b border-hueso/10">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-serif text-xl font-semibold tracking-[0.07em] text-hueso">
            DECARNES
          </Link>
          <span className="text-[10px] uppercase tracking-[0.28em] text-taupe">
            Carne argentina · MBEEF
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Lote {ref}</p>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight text-hueso sm:text-4xl">
          {nombreLote(f)}
        </h1>
        <p className="mt-2 text-taupe">
          {[corteVal, especie, f.kilos_totales ? `${f.kilos_totales} kg` : null, ubicacion]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {f.descripcion && (
          <p className="mt-4 max-w-2xl leading-relaxed text-taupe">{f.descripcion}</p>
        )}

        {/* Fotos */}
        {fotos.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fotos.map((u, i) => (
              <a
                key={i}
                href={u}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden border border-hueso/15"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Foto ${i + 1} del lote`} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-10 border-t border-hueso/10 pt-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Grilla de datos técnicos */}
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.28em] text-taupe">Datos del lote</h2>
            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {datos.map((d) => (
                <Dato key={d.label} label={d.label} value={d.value} consulta={d.consulta} />
              ))}
            </dl>

            {f.observaciones_calidad && (
              <p className="mt-8 border-t border-hueso/10 pt-6 leading-relaxed text-taupe">
                {f.observaciones_calidad}
              </p>
            )}
          </div>

          {/* Columna de consulta */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <ConsultaLote
              logueado={logueado}
              loteId={f.id}
              refCode={ref}
              corte={corteVal}
              kg={f.kilos_totales}
              provincia={f.ubicacion_provincia}
            />
          </aside>
        </div>

        <p className="mt-12 text-center text-xs text-taupe/60">
          Publicación de DeCarnes, la mesa de compras de MBEEF.
        </p>
      </main>
    </div>
  );
}
