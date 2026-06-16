import { inputBase } from "@/lib/ui";
import type { Comprador } from "@/lib/panel";

function Campo({
  name,
  label,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm text-taupe">
        {label}
        {required && <span className="text-bordo"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className={inputBase}
      />
    </div>
  );
}

// Campos del formulario de comprador (sirve para crear y editar).
export default function CompradorFields({ c }: { c?: Comprador }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Campo name="nombre" label="Nombre" required defaultValue={c?.nombre} />
      <Campo name="contacto" label="Contacto" defaultValue={c?.contacto} placeholder="Teléfono / email" />
      <div className="sm:col-span-2">
        <Campo name="cortes_busca" label="Cortes que busca" defaultValue={c?.cortes_busca} placeholder="Ej.: asado, vacío, bife ancho" />
      </div>
      <Campo name="volumenes" label="Volúmenes" defaultValue={c?.volumenes} placeholder="Ej.: 2.000 kg/semana" />
      <Campo name="frecuencia" label="Frecuencia" defaultValue={c?.frecuencia} placeholder="Ej.: semanal" />
      <Campo name="precio_max" label="Precio máximo (ARS/kg)" type="number" defaultValue={c?.precio_max} />
      <Campo name="plazo_habitual" label="Plazo habitual" defaultValue={c?.plazo_habitual} placeholder="Ej.: 30 días" />
      <Campo name="linea_credito" label="Línea de crédito (ARS)" type="number" defaultValue={c?.linea_credito} />
      <div className="sm:col-span-2">
        <label htmlFor="notas" className="mb-2 block text-sm text-taupe">Notas</label>
        <textarea id="notas" name="notas" rows={3} defaultValue={c?.notas ?? undefined} className={`${inputBase} resize-y`} />
      </div>
    </div>
  );
}
