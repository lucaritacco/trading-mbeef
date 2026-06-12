import { Reveal, Stagger, StaggerItem } from "./motion";

const ITEMS = [
  {
    title: "Vendemos por vos",
    body: "Acceso inmediato a una red de compradores activos: restaurantes, carnicerías y puntos de venta que ya nos compran. No esperás a que alguien aparezca: nosotros salimos a colocar.",
  },
  {
    title: "Cobro sin riesgo",
    body: "Te garantizamos el cobro de la operación. El riesgo del comprador lo administramos nosotros, con años de historial de quién paga y cómo.",
  },
  {
    title: "Logística resuelta",
    body: "Coordinamos el transporte refrigerado y la documentación de tránsito. Tu lote viaja en regla y con frío.",
  },
  {
    title: "Precio con fundamento",
    body: "Operamos el mercado todos los días. Nuestra oferta refleja valores reales de transacción, no especulación.",
  },
];

export default function Advantages() {
  return (
    <section id="ventajas" className="bg-hueso py-24 text-carbon sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-serif text-4xl font-medium sm:text-5xl">
            La solución integral
          </h2>
          <p className="mt-4 max-w-xl text-carbon/65">
            Una sola contraparte para colocar, cobrar y mover tu lote.
          </p>
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
