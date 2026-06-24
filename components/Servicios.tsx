import { Reveal, Stagger, StaggerItem } from "./motion";
import { site } from "@/lib/site";

const SERVICIOS = [
  {
    title: "Asesoramiento comercial",
    body: "Te ayudamos a definir precio y colocar lotes grandes.",
  },
  {
    title: "Colocación a comisión",
    body: "Si querés, operamos tu lote en nuestra red. A convenir según la operación.",
  },
  {
    title: "Coordinación logística",
    body: "Conexión con transportes de frío de confianza.",
  },
];

export default function Servicios() {
  return (
    <section id="servicios" className="border-y border-hueso/10 bg-carbon py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <span className="inline-block border border-salmon/40 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-salmon">
            Opcional · bajo consulta
          </span>
          <h2 className="mt-5 font-serif text-4xl font-medium text-hueso sm:text-5xl">
            Servicios para operar mejor
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-taupe">
            Además del mercado abierto y gratuito, MBEEF ofrece servicios para
            quienes los necesiten:
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-px border border-hueso/12 bg-hueso/10 sm:grid-cols-3" step={0.1}>
          {SERVICIOS.map((s) => (
            <StaggerItem key={s.title} className="bg-carbon p-8">
              <h3 className="font-serif text-2xl font-medium text-hueso">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-taupe">{s.body}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-hueso/30 px-7 py-3.5 text-base text-hueso transition-colors hover:border-hueso/70"
            >
              Consultanos
            </a>
            <span className="text-sm text-taupe/70">
              Estos servicios son aparte del mercado gratuito, sin tarifas
              publicadas.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
