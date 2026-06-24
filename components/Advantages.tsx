import { Reveal, Stagger, StaggerItem } from "./motion";

const ITEMS = [
  {
    title: "Más visibilidad",
    body: "En un mercado donde sobra oferta, lo difícil es que te vean. Acá tu lote lo ve todo el mercado, no solo tus contactos.",
  },
  {
    title: "Todo el país en un lugar",
    body: "Cortes de distintas provincias y proveedores, comparables en una sola pantalla.",
  },
  {
    title: "Respaldo de MBEEF",
    body: "Detrás de DeCarnes hay un operador con más de 30 años en el mercado de la carne. No es una plataforma anónima.",
  },
  {
    title: "Publicar es gratis",
    body: "Sumás tu stock sin costo ni comisión por publicar.",
  },
];

export default function Advantages() {
  return (
    <section id="ventajas" className="bg-hueso py-24 text-carbon sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-serif text-4xl font-medium sm:text-5xl">
            Por qué DeCarnes
          </h2>
        </Reveal>

        <Stagger
          className="mt-14 grid border border-carbon/15 sm:grid-cols-2"
          step={0.1}
        >
          {ITEMS.map((item, i) => (
            <StaggerItem
              key={item.title}
              className={`group p-8 transition-colors duration-300 hover:bg-white sm:p-10 ${
                i % 2 === 1 ? "sm:border-l sm:border-carbon/15" : ""
              } ${i >= 2 ? "border-t border-carbon/15" : i >= 1 ? "border-t border-carbon/15 sm:border-t-0" : ""}`}
            >
              <h3 className="font-serif text-2xl font-medium transition-colors duration-300 group-hover:text-bordo sm:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 max-w-[52ch] leading-relaxed text-carbon/70">
                {item.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
