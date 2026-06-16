import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFicha, firmarFoto } from "@/lib/ficha";
import { site } from "@/lib/site";
import {
  TIPO_PRODUCTO,
  LOTE_ESTADO,
  ENVASADO,
  labelDe,
} from "@/lib/opciones";
import { formatFecha } from "@/lib/panel";

function tituloLote(f: {
  tipo_producto: string | null;
  kilos_totales: number | null;
  ubicacion_provincia: string | null;
}): string {
  const partes = [
    `Lote ${labelDe(TIPO_PRODUCTO, f.tipo_producto) || "de carne"}`,
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
  const descripcion = [
    labelDe(TIPO_PRODUCTO, f.tipo_producto),
    f.especie_categoria,
    cortes,
  ]
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

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">{label}</dt>
      <dd className="mt-1 text-sm text-hueso">{value}</dd>
    </div>
  );
}

export default async function FichaPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const f = await getFicha(id);
  if (!f) notFound();

  const fotos = (
    await Promise.all((f.fotos_paths ?? []).map((p) => firmarFoto(p)))
  ).filter((u): u is string => Boolean(u));

  const cortes = [...(f.cortes ?? []), f.cortes_otro].filter(Boolean).join(", ");
  const ubicacion = [f.ubicacion_localidad, f.ubicacion_provincia]
    .filter(Boolean)
    .join(", ");

  const ref = f.id.slice(0, 8).toUpperCase();
  const texto = encodeURIComponent(
    `Hola, quiero consultar el lote ${ref} (${tituloLote(f).replace(" — DeCarnes", "")}).`,
  );
  const whatsappLote = `https://wa.me/${site.whatsapp}?text=${texto}`;

  return (
    <div className="min-h-svh">
      <header className="border-b border-hueso/10">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-serif text-xl font-semibold tracking-[0.07em] text-hueso">
            DECARNES
          </Link>
          <span className="text-[10px] uppercase tracking-[0.28em] text-taupe">
            Carne argentina · MBEEF
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">
          Lote {ref}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight text-hueso sm:text-4xl">
          {labelDe(TIPO_PRODUCTO, f.tipo_producto) || "Lote de carne"}
          {f.especie_categoria ? ` · ${f.especie_categoria}` : ""}
        </h1>
        <p className="mt-2 text-taupe">
          {[f.kilos_totales ? `${f.kilos_totales} kg` : null, ubicacion]
            .filter(Boolean)
            .join(" · ")}
        </p>

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

        {/* Especificaciones (solo datos comerciales) */}
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-hueso/10 pt-8 sm:grid-cols-3">
          <Dato label="Tipo de producto" value={labelDe(TIPO_PRODUCTO, f.tipo_producto)} />
          <Dato label="Especie / categoría" value={f.especie_categoria} />
          <Dato label="Cortes" value={cortes} />
          <Dato label="Kilos totales" value={f.kilos_totales ? `${f.kilos_totales} kg` : null} />
          <Dato label="Piezas / cajas" value={f.piezas_cajas} />
          <Dato label="Estado" value={labelDe(LOTE_ESTADO, f.lote_estado)} />
          <Dato
            label="Envasado"
            value={[labelDe(ENVASADO, f.envasado_tipo), f.envasado_marca].filter(Boolean).join(" · ")}
          />
          <Dato label="Faena" value={formatFecha(f.fecha_faena)} />
          <Dato label="Vencimiento" value={formatFecha(f.fecha_vencimiento)} />
          <Dato label="Ubicación" value={ubicacion} />
        </dl>

        {f.observaciones_calidad && (
          <p className="mt-8 border-t border-hueso/10 pt-6 leading-relaxed text-taupe">
            {f.observaciones_calidad}
          </p>
        )}

        {/* CTA: sin precios, solo consulta por WhatsApp */}
        <div className="mt-12 border border-hueso/15 bg-carbon/40 p-7 text-center">
          <p className="font-serif text-2xl font-medium text-hueso">
            ¿Te interesa este lote?
          </p>
          <p className="mt-2 text-sm text-taupe">
            Consultá disponibilidad y condiciones con nuestro equipo.
          </p>
          <a
            href={whatsappLote}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 bg-bordo px-8 py-4 text-base font-medium text-hueso transition-colors hover:bg-rojo"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.477-.917z" />
            </svg>
            Consultar este lote
          </a>
        </div>

        <p className="mt-10 text-center text-xs text-taupe/60">
          Publicación de DeCarnes, la mesa de compras de MBEEF.
        </p>
      </main>
    </div>
  );
}
