import { site } from "@/lib/site";

// Consulta pública de un lote: SIN login. Abre WhatsApp directo a MBEEF (número
// público de site config) con un mensaje pre-cargado que incluye la referencia,
// corte, kg, provincia y el link a la ficha. Nunca llama a contacto_lote ni
// expone datos del frigorífico: el contacto es siempre con MBEEF.

const ESPECIFICAS = [
  { key: "esp", label: "Pedir especificaciones", q: "¿Me pasás las especificaciones completas?" },
  { key: "precio", label: "Precio y condiciones", q: "¿Me confirmás precio, disponibilidad y forma de pago?" },
  { key: "fotos", label: "Pedir más fotos", q: "¿Tenés más fotos del lote?" },
] as const;

const GENERICA = "¿Me pasás más información y disponibilidad?";

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.477-.917z" />
    </svg>
  );
}

export default function ConsultaLote({
  refCode,
  corte,
  kg,
  provincia,
  fichaUrl,
}: {
  refCode: string;
  corte: string | null;
  kg: number | null;
  provincia: string | null;
  fichaUrl: string;
}) {
  const detalle = [corte, kg ? `${kg} kg` : null, provincia].filter(Boolean).join(", ");
  const base = `Hola, me interesa el lote ${refCode}${detalle ? ` (${detalle})` : ""}.`;
  const wa = (pregunta: string) =>
    `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`${base} ${pregunta}\n${fichaUrl}`)}`;

  const secClass =
    "block w-full border border-hueso/20 px-5 py-3 text-left text-sm text-hueso transition-colors hover:border-bordo hover:bg-hueso/[0.03]";

  return (
    <div className="border border-hueso/15 bg-carbon/40 p-6">
      <p className="font-serif text-xl font-medium text-hueso">Consultá este lote</p>
      <p className="mt-1 text-sm text-taupe">
        Te contesta un operador de MBEEF con disponibilidad, precio y condiciones.
      </p>
      <a
        href={wa(GENERICA)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 bg-bordo px-6 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo"
      >
        <WhatsappIcon />
        Consultar por WhatsApp
      </a>
      <div className="mt-3 space-y-2">
        {ESPECIFICAS.map((b) => (
          <a key={b.key} href={wa(b.q)} target="_blank" rel="noopener noreferrer" className={secClass}>
            {b.label}
          </a>
        ))}
      </div>
    </div>
  );
}
