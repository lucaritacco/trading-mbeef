import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFicha, firmarFoto, getPrecios, type FichaPublica } from "@/lib/ficha";
import { createSupabaseServer } from "@/lib/supabase/server";
import ConsultaLote from "@/components/ficha/ConsultaLote";
import CompartirWhatsapp from "@/components/CompartirWhatsapp";
import {
  TIPO_PRODUCTO,
  LOTE_ESTADO,
  ENVASADO,
  MODALIDAD_ENTREGA,
  labelDe,
} from "@/lib/opciones";
import { formatFecha, formatARS } from "@/lib/panel";
import { SITE_URL, jsonLdBreadcrumbs, jsonLdProps } from "@/lib/seo";

const SITE = SITE_URL;

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
  // Descripción breve para la portada de WhatsApp: primero la del lote, si no un
  // resumen comercial. Se recorta para que no quede cortada fea en la preview.
  const resumen =
    [labelDe(TIPO_PRODUCTO, f.tipo_producto), f.especie_categoria, cortes]
      .filter(Boolean)
      .join(" · ") || "Carne vacuna. Consultá condiciones por WhatsApp.";
  const cruda = (f.descripcion?.trim() || resumen).replace(/\s+/g, " ");
  const descripcion = cruda.length > 180 ? `${cruda.slice(0, 177)}…` : cruda;

  const ogPath = f.fotos_paths?.[0];
  const ogUrl = ogPath ? await firmarFoto(ogPath) : null;
  const fichaUrl = `${SITE}/lote/${id}`;

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: fichaUrl },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: fichaUrl,
      type: "website",
      images: ogUrl ? [{ url: ogUrl, alt: titulo }] : [],
    },
    twitter: {
      card: ogUrl ? "summary_large_image" : "summary",
      title: titulo,
      description: descripcion,
      images: ogUrl ? [ogUrl] : undefined,
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
      <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">{label}</dt>
      <dd className="mt-1 text-sm">
        {cargado ? (
          <span className="text-texto">{value}</span>
        ) : (
          <span className="italic text-texto-sec">{consulta}</span>
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

  // La ficha es pública e indexable, pero el PRECIO va detrás del login: no se
  // expone la lista de precios del vendedor a la competencia ni a Google.
  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const logueado = Boolean(user);
  const precio = logueado
    ? (await getPrecios(supabaseServer, [f.id])).get(f.id) ?? null
    : null;

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
  const ubicacion = f.ubicacion_provincia;

  const ref = f.id.slice(0, 8).toUpperCase();
  const fichaUrl = `${SITE}/lote/${f.id}`;
  const compartirTexto = `${nombreLote(f)} — ${[
    corteVal,
    f.kilos_totales ? `${f.kilos_totales} kg` : null,
    f.ubicacion_provincia,
  ]
    .filter(Boolean)
    .join(", ")}`;

  const datos: { label: string; value: React.ReactNode; consulta: string }[] = [
    { label: "Corte / artículo", value: corteVal, consulta: "Consultá el corte" },
    { label: "Especie / categoría", value: especie, consulta: "Consultá la categoría" },
    { label: "Kilos totales", value: f.kilos_totales ? `${f.kilos_totales} kg` : null, consulta: "Consultá los kilos" },
    { label: "Piezas / cajas", value: f.piezas_cajas, consulta: "Consultá las piezas/cajas" },
    { label: "Compra mínima", value: f.moq ? `${f.moq} kg` : null, consulta: "Consultá la cantidad mínima" },
    { label: "Estado", value: labelDe(LOTE_ESTADO, f.lote_estado), consulta: "Consultá el estado" },
    { label: "Envasado", value: packaging, consulta: "Consultá el packaging" },
    { label: "Entrega", value: labelDe(MODALIDAD_ENTREGA, f.modalidad_entrega), consulta: "Consultá la modalidad de entrega" },
    { label: "Certificados", value: certificados, consulta: "Consultá los certificados" },
    { label: "Faena", value: f.fecha_faena ? formatFecha(f.fecha_faena) : null, consulta: "Consultá la fecha de faena" },
    { label: "Vencimiento", value: f.fecha_vencimiento ? formatFecha(f.fecha_vencimiento) : null, consulta: "Consultá el vencimiento" },
    { label: "Provincia", value: ubicacion, consulta: "Consultá la provincia" },
  ];

  // Product para Google. NO lleva `offers` con precio: el precio está detrás del
  // login, así que no debe viajar en el marcado (Google lo leería y lo mostraría).
  // Nota: las fotos son URLs firmadas con vencimiento; Google las re-descarga
  // en cada crawl, así que sirven, pero no son estables para cachear.
  const productoJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${fichaUrl}#producto`,
    name: nombreLote(f),
    description:
      f.descripcion?.trim() ||
      [especie, corteVal, ubicacion].filter(Boolean).join(" · ") ||
      "Lote de carne vacuna de frigorífico seleccionado por MBEEF.",
    category: corteVal || "Carne vacuna",
    ...(fotos.length > 0 ? { image: fotos } : {}),
    brand: { "@type": "Brand", name: "MBEEF" },
    sku: ref,
  };

  return (
    <div className="min-h-svh bg-superficie text-texto">
      <script
        {...jsonLdProps([
          jsonLdBreadcrumbs([
            { nombre: "Inicio", path: "/" },
            { nombre: "Lotes publicados", path: "/mercado" },
            { nombre: nombreLote(f), path: `/lote/${f.id}` },
          ]),
          productoJsonLd,
        ])}
      />
      <header className="border-b border-borde">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-serif text-xl font-semibold tracking-[0.07em] text-texto">
            DECARNES
          </Link>
          <span className="text-[10px] uppercase tracking-[0.28em] text-texto-sec">
            Carne argentina · MBEEF
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">Lote {ref}</p>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight text-texto sm:text-4xl">
          {nombreLote(f)}
        </h1>
        <p className="mt-2 text-texto-sec">
          {[corteVal, especie, f.kilos_totales ? `${f.kilos_totales} kg` : null, ubicacion]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* Origen anónimo: todos los lotes se presentan bajo el paraguas de MBEEF */}
        <span className="mt-4 inline-flex items-center gap-2 border border-borde px-3.5 py-2 text-sm text-texto-sec">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primario/10 text-xs font-semibold text-primario">
            M
          </span>
          Frigorífico seleccionado por MBEEF
        </span>

        {f.descripcion && (
          <p className="mt-4 max-w-2xl leading-relaxed text-texto-sec">{f.descripcion}</p>
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
                className="block aspect-square overflow-hidden border border-borde"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Foto ${i + 1} del lote`} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-10 border-t border-borde pt-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Grilla de datos técnicos */}
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.28em] text-texto-sec">Datos del lote</h2>
            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {datos.map((d) => (
                <Dato key={d.label} label={d.label} value={d.value} consulta={d.consulta} />
              ))}
            </dl>

            {f.observaciones_calidad && (
              <p className="mt-8 border-t border-borde pt-6 leading-relaxed text-texto-sec">
                {f.observaciones_calidad}
              </p>
            )}
          </div>

          {/* Columna de precio + consulta */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            {/* Precio: solo con cuenta (no se expone a la competencia ni a Google) */}
            <div className="mb-3 border border-borde bg-fondo p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Precio por kg</p>
              {logueado ? (
                precio != null ? (
                  <p className="mt-1 font-serif text-3xl text-texto">
                    {formatARS(precio)}
                    <span className="text-base text-texto-sec"> /kg</span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm italic text-texto-sec">Consultá el precio</p>
                )
              ) : (
                <>
                  <p className="mt-1 font-serif text-2xl text-texto-sec">— — —</p>
                  <p className="mt-2 text-sm text-texto-sec">
                    El precio y la consulta son para usuarios con cuenta.
                  </p>
                  <Link
                    href="/sumate"
                    className="mt-4 inline-block bg-primario px-5 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
                  >
                    Crear cuenta gratis
                  </Link>
                  <p className="mt-3 text-xs text-texto-sec">
                    ¿Ya tenés?{" "}
                    <Link href="/login" className="text-primario hover:text-texto">
                      Iniciá sesión
                    </Link>
                  </p>
                </>
              )}
            </div>

            {logueado && (
              <ConsultaLote
                loteId={f.id}
                refCode={ref}
                corte={corteVal}
                kg={f.kilos_totales}
                provincia={f.ubicacion_provincia}
                fichaUrl={fichaUrl}
              />
            )}
            <div className="mt-3">
              <CompartirWhatsapp texto={compartirTexto} url={fichaUrl} full label="Compartir por WhatsApp" />
            </div>
          </aside>
        </div>

        <p className="mt-12 text-center text-xs text-texto-sec">
          Publicación de DeCarnes, la mesa de compras de MBEEF.
        </p>
      </main>
    </div>
  );
}
