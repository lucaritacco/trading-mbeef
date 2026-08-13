const PILARES = [
  { t: "Verificación DeCarnes", d: "Identidad y documentación" },
  { t: "Solo frigoríficos", d: "Perfiles comerciales validados" },
  { t: "Stock publicado", d: "Información clara y actualizada" },
  { t: "Contacto directo", d: "Entre empresas" },
];

// Banda de confianza justo bajo el hero: responde "por qué creerte" antes de
// que el comprador baje a mirar lotes.
export default function Pilares() {
  return (
    <section className="border-b border-borde bg-superficie">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-7 px-5 py-8 sm:px-8 lg:grid-cols-4 lg:gap-0">
        {PILARES.map((p, i) => (
          <div key={p.t} className={i > 0 ? "lg:border-l lg:border-borde lg:pl-8" : ""}>
            <p className="font-serif text-base font-medium text-texto sm:text-lg">{p.t}</p>
            <p className="mt-1 text-xs text-texto-sec">{p.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
