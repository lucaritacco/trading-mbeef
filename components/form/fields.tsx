"use client";

import type { Opcion } from "@/lib/opciones";

export const inputBase =
  "w-full rounded-none border border-hueso/20 bg-carbon/40 px-4 py-3 text-hueso placeholder:text-taupe/40 outline-none transition-colors focus:border-bordo";

export function FieldShell({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm text-taupe">
        {label}
        {required && <span className="text-bordo"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-rojo-claro">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-taupe/60">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  maxLength?: number;
}) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
        aria-invalid={!!error}
      />
    </FieldShell>
  );
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} resize-y`}
        aria-invalid={!!error}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  hint,
  required,
  placeholder = "Elegí una opción",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Opcion[];
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} appearance-none bg-[length:0.65rem] bg-[right_1rem_center] bg-no-repeat pr-10 [background-image:url('data:image/svg+xml;utf8,<svg_xmlns=%22http://www.w3.org/2000/svg%22_viewBox=%220_0_12_8%22_fill=%22none%22_stroke=%22%23c3aea7%22_stroke-width=%221.5%22><path_d=%22M1_1l5_5_5-5%22/></svg>')] ${
          value ? "text-hueso" : "text-taupe/40"
        }`}
        aria-invalid={!!error}
      >
        <option value="" disabled className="bg-carbon text-taupe">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-carbon text-hueso">
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function RadioCards({
  label,
  value,
  onChange,
  options,
  error,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Opcion[];
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={`border px-4 py-2.5 text-sm transition-colors ${
                active
                  ? "border-bordo bg-bordo/15 text-hueso"
                  : "border-hueso/20 text-taupe hover:border-hueso/45 hover:text-hueso"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

export function CheckboxChips({
  label,
  value,
  onChange,
  options,
  error,
  hint,
  required,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  const toggle = (item: string) =>
    onChange(
      value.includes(item)
        ? value.filter((x) => x !== item)
        : [...value, item],
    );
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              aria-pressed={active}
              className={`border px-3.5 py-2 text-sm transition-colors ${
                active
                  ? "border-bordo bg-bordo/15 text-hueso"
                  : "border-hueso/20 text-taupe hover:border-hueso/45 hover:text-hueso"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

export function Checkbox({
  id,
  checked,
  onChange,
  children,
  error,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
            checked ? "border-bordo bg-bordo" : "border-hueso/30 bg-transparent"
          }`}
        >
          {checked && (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-hueso" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          )}
        </span>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span className="text-sm leading-relaxed text-taupe">{children}</span>
      </label>
      {error && <p className="mt-1.5 text-xs text-rojo-claro">{error}</p>}
    </div>
  );
}
