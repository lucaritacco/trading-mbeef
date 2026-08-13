import { Reveal, Stagger, StaggerItem } from "./motion";

const ITEMS = [
  {
    title: "Frigoríficos seleccionados",
    body: "No es un clasificado abierto: elegimos con qué frigoríficos trabajamos y qué lotes publicamos.",
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
    title: "Consultar es gratis",
    body: "Ver el catálogo y consultar no tiene costo.",
  },
];

export default function Advantages() {
  return (
    <section id="ventajas" className="bg-fondo py-24 text-texto sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-serif text-4xl font-medium sm:text-5xl">
            Por qué DeCarnes
          </h2>
        </Reveal>

        <Stagger
          className="mt-14 grid border border-borde sm:grid-cols-2"
          step={0.1}
        >
          {ITEMS.map((item, i) => (
            <StaggerItem
              key={item.title}
              className={`group p-8 transition-colors duration-300 hover:bg-white sm:p-10 ${
                i % 2 === 1 ? "sm:border-l sm:border-borde" : ""
              } ${i >= 2 ? "border-t border-borde" : i >= 1 ? "border-t border-borde sm:border-t-0" : ""}`}
            >
              <h3 className="font-serif text-2xl font-medium transition-colors duration-300 group-hover:text-primario sm:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 max-w-[52ch] leading-relaxed text-texto-sec">
                {item.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
