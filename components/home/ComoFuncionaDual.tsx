const COMPRADORES = [
  { t: "Creá tu cuenta", d: "Accedé a precios y condiciones." },
  { t: "Compará lotes", d: "Filtrá por corte, estado y zona." },
  { t: "Contactá al vendedor", d: "Consultá al frigorífico responsable." },
];

const FRIGORIFICOS = [
  { t: "Registrá tu empresa", d: "Creá el perfil del frigorífico." },
  { t: "Completá la verificación", d: "DeCarnes valida la documentación." },
  { t: "Publicá tu stock", d: "Administrá lotes y recibí consultas." },
];

function Pasos({ titulo, pasos }: { titulo: string; pasos: typeof COMPRADORES }) {
  return (
    <div className="border border-borde bg-superficie p-7 sm:p-8">
      <h3 className="font-serif text-xl font-medium text-texto sm:text-2xl">{titulo}</h3>
      <ol className="mt-6 space-y-5">
        {pasos.map((p, i) => (
          <li key={p.t} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primario-suave text-xs font-medium text-primario">
              {i + 1}
            </span>
            <span>
              <span className="block text-sm font-medium text-texto">{p.t}</span>
              <span className="block text-sm text-texto-sec">{p.d}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ComoFuncionaDual() {
  return (
    <section id="como-funciona" className="bg-superficie">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.3fr] lg:gap-14">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-primario">Cómo funciona</p>
          <h2 className="mt-3 font-serif text-[clamp(1.8rem,4vw,2.9rem)] font-medium leading-tight text-texto">
            Claro para comprar.
            <br />
            Simple para publicar.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-texto-sec">
            Cada perfil opera desde su cuenta dentro del marketplace DeCarnes.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Pasos titulo="Para compradores" pasos={COMPRADORES} />
          <Pasos titulo="Para frigoríficos" pasos={FRIGORIFICOS} />
        </div>
      </div>
    </section>
  );
}
