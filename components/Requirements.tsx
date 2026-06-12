import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "./motion";

const REQUISITOS = [
  "Habilitación sanitaria vigente (SENASA, provincial o municipal)",
  "Inscripción RUCA",
  "CUIT activo",
  "Producto con trazabilidad",
];

export default function Requirements() {
  return (
    <section id="requisitos" className="bg-hueso py-24 text-carbon sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 md:grid-cols-[1.1fr_1fr] md:gap-20">
        <Reveal>
          <h2 className="font-serif text-4xl font-medium sm:text-5xl">
            Para quién es
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-carbon/75">
            Trabajamos con proveedores habilitados. Para publicar necesitás:
          </p>
          <p className="mt-8 font-serif text-2xl font-medium text-bordo">
            ¿Cumplís? Tu lote puede estar ofertado mañana.
          </p>
          <Link
            href="/publicar"
            className="mt-6 inline-block bg-bordo px-6 py-3.5 text-sm font-medium text-hueso transition-colors hover:bg-rojo"
          >
            Publicar un lote
          </Link>
        </Reveal>

        <Stagger className="space-y-0 self-center" step={0.1}>
          {REQUISITOS.map((req, i) => (
            <StaggerItem
              key={req}
              className={`flex items-center gap-4 py-5 ${i > 0 ? "border-t border-carbon/15" : ""}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="var(--verde)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
              <span className="leading-snug">{req}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
