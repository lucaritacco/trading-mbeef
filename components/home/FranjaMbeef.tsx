import Link from "next/link";

// El servicio de colocación de MBEEF queda al final y en tinta: es una salida
// para el que no quiere publicar solo, no la propuesta principal del marketplace.
export default function FranjaMbeef() {
  return (
    <section className="bg-fondo pb-16 pt-4 sm:pb-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 bg-tinta px-8 py-10 text-superficie sm:px-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primario">
              Servicio comercial opcional · MBEEF
            </p>
            <p className="mt-3 font-serif text-[clamp(1.6rem,3.4vw,2.4rem)] font-medium leading-tight">
              ¿Preferís delegar la venta?
            </p>
            <p className="mt-2 text-sm text-superficie/70">
              MBEEF comercializa tu stock a comisión.
            </p>
          </div>
          <Link
            href="/vendedores"
            className="shrink-0 self-start bg-superficie px-7 py-3.5 text-sm font-medium text-tinta transition-colors hover:bg-fondo md:self-auto"
          >
            Conocer el servicio →
          </Link>
        </div>
      </div>
    </section>
  );
}
