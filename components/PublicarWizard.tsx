"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { site } from "@/lib/site";
import { crearLote, type LoteFormData } from "@/lib/lotes";
import { notifyNuevoLote } from "@/lib/notify";
import { validarCuit, formatearCuit, validarWhatsapp, validarEmail } from "@/lib/validators";
import * as O from "@/lib/opciones";
import {
  TextField,
  TextArea,
  SelectField,
  RadioCards,
  CheckboxChips,
  Checkbox,
} from "./form/fields";
import PhotoUploader from "./form/PhotoUploader";

const STORAGE_KEY = "decarnes_publicar_v1";

const EMPTY: LoteFormData = {
  tipo_producto: "",
  especie_categoria: "",
  cortes: [],
  cortes_otro: "",
  kilos_totales: "",
  piezas_cajas: "",
  lote_estado: "",
  fecha_faena: "",
  fecha_vencimiento: "",
  envasado_tipo: "",
  envasado_marca: "",
  ubicacion_provincia: "",
  ubicacion_localidad: "",
  observaciones_calidad: "",
  precio_pretendido_kg: "",
  condicion_pago: "",
  disponibilidad_desde: "",
  necesita_flete: "",
  preferencia_operacion: "lo_que_convenga",
  contacto_nombre: "",
  contacto_telefono: "",
  contacto_email: "",
  cuit: "",
  acepta_contacto: false,
};

type Errores = Record<string, string>;

export default function PublicarWizard() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<LoteFormData>(EMPTY);
  const [fotos, setFotos] = useState<File[]>([]);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [loteId, setLoteId] = useState<string | null>(null);
  const [hidratado, setHidratado] = useState(false);

  // Hidratar desde localStorage (no perder texto al volver / recargar).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* ignorar */
    }
    setHidratado(true);
  }, []);

  // Persistir solo los campos de texto (las fotos no van a localStorage).
  useEffect(() => {
    if (!hidratado) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignorar */
    }
  }, [data, hidratado]);

  const set =
    <K extends keyof LoteFormData>(k: K) =>
    (v: LoteFormData[K]) =>
      setData((d) => ({ ...d, [k]: v }));

  function validarPaso1(): Errores {
    const e: Errores = {};
    if (!data.tipo_producto) e.tipo_producto = "Elegí el tipo de producto.";
    if (!data.especie_categoria.trim()) e.especie_categoria = "Indicá especie y categoría.";
    if (data.cortes.length === 0 && !data.cortes_otro.trim())
      e.cortes = "Seleccioná al menos un corte o describilo.";
    if (!data.kilos_totales || Number(data.kilos_totales) <= 0)
      e.kilos_totales = "Ingresá los kilos totales.";
    if (!data.lote_estado) e.lote_estado = "Enfriado o congelado.";
    if (!data.fecha_faena) e.fecha_faena = "Indicá la fecha de faena.";
    if (!data.fecha_vencimiento) e.fecha_vencimiento = "Indicá el vencimiento.";
    if (
      data.fecha_faena &&
      data.fecha_vencimiento &&
      data.fecha_vencimiento < data.fecha_faena
    )
      e.fecha_vencimiento = "El vencimiento no puede ser anterior a la faena.";
    if (!data.envasado_tipo) e.envasado_tipo = "Elegí el tipo de envasado.";
    if (!data.ubicacion_provincia) e.ubicacion_provincia = "Elegí la provincia.";
    if (!data.ubicacion_localidad.trim()) e.ubicacion_localidad = "Indicá la localidad.";
    if (fotos.length < 2) e.fotos = "Subí al menos 2 fotos.";
    return e;
  }

  function validarPaso2(): Errores {
    const e: Errores = {};
    if (!data.precio_pretendido_kg || Number(data.precio_pretendido_kg) <= 0)
      e.precio_pretendido_kg = "Ingresá un precio orientativo.";
    if (!data.condicion_pago) e.condicion_pago = "Elegí la condición de pago.";
    if (!data.disponibilidad_desde) e.disponibilidad_desde = "Indicá desde cuándo.";
    if (!data.necesita_flete) e.necesita_flete = "Indicá si coordinamos el flete.";
    if (!data.preferencia_operacion) e.preferencia_operacion = "Elegí el modo de operación.";
    if (!data.contacto_nombre.trim()) e.contacto_nombre = "Tu nombre y apellido.";
    if (!validarWhatsapp(data.contacto_telefono))
      e.contacto_telefono = "Ingresá un WhatsApp válido.";
    if (data.contacto_email.trim() && !validarEmail(data.contacto_email))
      e.contacto_email = "Revisá el email.";
    if (!validarCuit(data.cuit)) e.cuit = "CUIT inválido (revisá el número).";
    if (!data.acepta_contacto) e.acepta_contacto = "Necesitamos tu consentimiento para contactarte.";
    return e;
  }

  function siguiente() {
    const e = validarPaso1();
    setErrores(e);
    if (Object.keys(e).length === 0) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function volver() {
    setErrores({});
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function enviar() {
    const e = validarPaso2();
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const id = await crearLote(data, fotos);
      await notifyNuevoLote(id);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignorar */
      }
      setLoteId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : "Algo salió mal. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (loteId) return <Confirmacion id={loteId} />;

  const hoy = new Date().toISOString().slice(0, 10);
  const t = reduced ? {} : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-32 sm:px-8">
      <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Pedí tu cotización</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">
        Publicá tu lote
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-taupe">
        Cargá el lote y tus condiciones. No te pedimos ninguna documentación
        para publicar: la cotización la recibís igual.
      </p>

      {/* Barra de progreso */}
      <div className="mt-10">
        <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-taupe">
          <span className={step === 1 ? "text-hueso" : ""}>1 · El lote</span>
          <span className={step === 2 ? "text-hueso" : ""}>2 · Condiciones y contacto</span>
        </div>
        <div className="mt-2 h-1 w-full bg-hueso/10">
          <motion.div
            className="h-full bg-bordo"
            initial={false}
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={t}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduced ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? undefined : { opacity: 0, x: -16 }}
          transition={t}
          className="mt-10 space-y-7"
        >
          {step === 1 ? (
            <>
              <SelectField id="tipo_producto" label="Tipo de producto" required value={data.tipo_producto} onChange={set("tipo_producto")} options={O.TIPO_PRODUCTO} error={errores.tipo_producto} />
              <TextField id="especie_categoria" label="Especie y categoría" required placeholder="Ej.: novillo, vaquillona, vaca" value={data.especie_categoria} onChange={set("especie_categoria")} error={errores.especie_categoria} />
              <CheckboxChips label="Cortes incluidos" required value={data.cortes} onChange={set("cortes")} options={O.CORTES} error={errores.cortes} hint="Tocá los que correspondan." />
              <TextField id="cortes_otro" label="Otros cortes / detalle" placeholder="Si falta alguno, escribilo acá" value={data.cortes_otro} onChange={set("cortes_otro")} />
              <div className="grid gap-7 sm:grid-cols-2">
                <TextField id="kilos_totales" label="Kilos totales" required type="number" inputMode="decimal" placeholder="Ej.: 1200" value={data.kilos_totales} onChange={set("kilos_totales")} error={errores.kilos_totales} />
                <TextField id="piezas_cajas" label="Piezas o cajas" type="number" inputMode="numeric" placeholder="Opcional" value={data.piezas_cajas} onChange={set("piezas_cajas")} />
              </div>
              <RadioCards label="Estado" required value={data.lote_estado} onChange={set("lote_estado")} options={O.LOTE_ESTADO} error={errores.lote_estado} />
              <div className="grid gap-7 sm:grid-cols-2">
                <TextField id="fecha_faena" label="Fecha de faena" required type="date" value={data.fecha_faena} onChange={set("fecha_faena")} error={errores.fecha_faena} />
                <TextField id="fecha_vencimiento" label="Fecha de vencimiento" required type="date" value={data.fecha_vencimiento} onChange={set("fecha_vencimiento")} error={errores.fecha_vencimiento} />
              </div>
              <RadioCards label="Tipo de envasado" required value={data.envasado_tipo} onChange={set("envasado_tipo")} options={O.ENVASADO} error={errores.envasado_tipo} />
              <TextField id="envasado_marca" label="Marca o rotulado" placeholder="Si el envasado tiene marca, indicala" value={data.envasado_marca} onChange={set("envasado_marca")} />
              <PhotoUploader label="Fotos del producto y del envasado" fotos={fotos} onChange={setFotos} error={errores.fotos} />
              <div className="grid gap-7 sm:grid-cols-2">
                <SelectField id="ubicacion_provincia" label="Provincia del lote" required value={data.ubicacion_provincia} onChange={set("ubicacion_provincia")} options={O.provinciaOpciones} error={errores.ubicacion_provincia} />
                <TextField id="ubicacion_localidad" label="Localidad" required placeholder="Dónde está el lote" value={data.ubicacion_localidad} onChange={set("ubicacion_localidad")} error={errores.ubicacion_localidad} />
              </div>
              <TextArea id="observaciones_calidad" label="Observaciones de calidad" placeholder="Lo que quieras agregar sobre el lote" value={data.observaciones_calidad} onChange={set("observaciones_calidad")} />

              <div className="flex items-center justify-between pt-2">
                <Link href="/" className="text-sm text-taupe transition-colors hover:text-hueso">
                  Cancelar
                </Link>
                <button type="button" onClick={siguiente} className="bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo">
                  Continuar
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <TextField id="precio_pretendido_kg" label="Precio pretendido por kg (ARS)" required type="number" inputMode="decimal" placeholder="Ej.: 3500" value={data.precio_pretendido_kg} onChange={set("precio_pretendido_kg")} error={errores.precio_pretendido_kg} />
                <p className="mt-1.5 text-xs text-salmon">
                  Es orientativo: vas a recibir nuestra cotización en firme.
                </p>
              </div>
              <RadioCards label="Condición de pago pretendida" required value={data.condicion_pago} onChange={set("condicion_pago")} options={O.CONDICION_PAGO} error={errores.condicion_pago} />
              <TextField id="disponibilidad_desde" label="Disponibilidad de carga (desde)" required type="date" value={data.disponibilidad_desde} onChange={set("disponibilidad_desde")} error={errores.disponibilidad_desde} />
              <RadioCards label="¿Coordinamos el flete?" required value={data.necesita_flete} onChange={set("necesita_flete")} options={O.NECESITA_FLETE} error={errores.necesita_flete} />
              <RadioCards label="Modo de operación preferido" required value={data.preferencia_operacion} onChange={set("preferencia_operacion")} options={O.PREFERENCIA_OPERACION} error={errores.preferencia_operacion} />

              <div className="border-t border-hueso/10 pt-7">
                <h2 className="font-serif text-2xl font-medium text-hueso">Tus datos de contacto</h2>
                <p className="mt-1.5 text-sm text-taupe">
                  Lo mínimo para cotizarte. La documentación la cargás después,
                  solo si avanzamos.
                </p>
              </div>
              <div className="grid gap-7 sm:grid-cols-2">
                <TextField id="contacto_nombre" label="Nombre y apellido" required value={data.contacto_nombre} onChange={set("contacto_nombre")} error={errores.contacto_nombre} />
                <TextField id="contacto_telefono" label="WhatsApp" required type="tel" inputMode="tel" placeholder="Ej.: 11 5555 5555" value={data.contacto_telefono} onChange={set("contacto_telefono")} error={errores.contacto_telefono} />
              </div>
              <div className="grid gap-7 sm:grid-cols-2">
                <TextField id="contacto_email" label="Email" type="email" inputMode="email" placeholder="Opcional" value={data.contacto_email} onChange={set("contacto_email")} error={errores.contacto_email} />
                <TextField id="cuit" label="CUIT" required inputMode="numeric" placeholder="XX-XXXXXXXX-X" maxLength={13} value={data.cuit} onChange={(v) => set("cuit")(formatearCuit(v))} error={errores.cuit} hint="No te pedimos constancias todavía." />
              </div>
              <Checkbox id="acepta_contacto" checked={data.acepta_contacto} onChange={set("acepta_contacto")} error={errores.acepta_contacto}>
                Acepto ser contactado por DeCarnes / MBEEF por esta publicación.
              </Checkbox>

              {errorEnvio && (
                <p className="border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">
                  {errorEnvio}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={volver} disabled={enviando} className="text-sm text-taupe transition-colors hover:text-hueso disabled:opacity-50">
                  Volver
                </button>
                <button type="button" onClick={enviar} disabled={enviando} className="bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo disabled:opacity-60">
                  {enviando ? "Publicando…" : "Publicar lote"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Confirmacion({ id }: { id: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-36 sm:px-8">
      <div className="flex h-14 w-14 items-center justify-center border border-verde-claro/50">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-verde-claro" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5l5 5L20 6.5" />
        </svg>
      </div>
      <h1 className="mt-6 font-serif text-4xl font-medium text-hueso sm:text-5xl">
        Recibimos tu lote.
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-taupe">
        Un operador de DeCarnes te contacta en menos de 24 horas hábiles con una
        cotización.
      </p>

      <div className="mt-8 border border-hueso/15 bg-carbon/40 px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-taupe">Número de referencia</p>
        <p className="mt-1 font-mono text-sm text-hueso">{id}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="bg-bordo px-7 py-4 text-base font-medium text-hueso transition-colors hover:bg-rojo">
          Escribirnos por WhatsApp
        </a>
        <Link href="/" className="border border-hueso/30 px-7 py-4 text-base text-hueso transition-colors hover:border-hueso/70">
          Volver al inicio
        </Link>
      </div>

      <div className="mt-10 border-t border-hueso/10 pt-8">
        <p className="text-sm leading-relaxed text-taupe">
          <span className="text-hueso">¿Querés ir más rápido?</span> Podés
          completar tu legajo (datos de empresa y documentación) ahora. Es
          opcional: te ahorra tiempo solo si avanzamos con la operación.
        </p>
        <Link href={`/publicar/legajo/${id}`} className="mt-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-salmon transition-colors hover:text-hueso">
          Completar mi legajo ahora
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
