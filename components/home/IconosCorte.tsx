// Iconos de cortes: SVG propios, trazo simple, heredan currentColor.
// Silueta esquemática de cada corte — no pretenden ser anatómicos, sino legibles
// a 32px y coherentes entre sí (mismo grosor de línea y caja de 24x24).

type P = { className?: string };
const base = (className?: string) => ({
  viewBox: "0 0 24 24",
  className: className ?? "h-7 w-7",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

// Costillar / asado: tira con marcas de costilla.
export const IconAsado = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 8.5c2-1.6 5-2.2 9-2.2s7 .6 9 2.2v7c-2 1.6-5 2.2-9 2.2s-7-.6-9-2.2z" />
    <path d="M8 6.6v10.8M12 6.3v11.4M16 6.6v10.8" />
  </svg>
);

// Bife con hueso: ojo de bife + hueso en T.
export const IconBife = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3.5c4.7 0 8.5 3.4 8.5 8s-3.8 9-8.5 9-8.5-4.4-8.5-9 3.8-8 8.5-8z" />
    <path d="M12 8.2v8.4M12 12.4H7.8" />
  </svg>
);

// Lomo: pieza alargada y afinada en un extremo.
export const IconLomo = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3.5 14.4c1.2-4.6 5-7.6 9.8-7.6 4 0 7.2 2 7.2 4.6 0 3.2-3.6 5.8-9 6.4-4.2.5-8-.6-8-3.4z" />
    <path d="M8.6 11.2c1.8-.9 4-1.3 6.2-1" />
  </svg>
);

// Cuarto trasero / nalga: pieza redondeada con veta.
export const IconNalga = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3.6c4.6 0 8 3.6 8 8.2 0 5-3.6 8.6-8 8.6s-8-3.6-8-8.6c0-4.6 3.4-8.2 8-8.2z" />
    <path d="M9 9.6c2.2 1.4 4.2 3.6 5.4 6.2" />
  </svg>
);

// Vacío / matambre: manta rectangular con borde ondulado.
export const IconManta = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3.4 7.6c3-1.4 5.6-1.4 8.6 0s5.6 1.4 8.6 0v8.8c-3 1.4-5.6 1.4-8.6 0s-5.6-1.4-8.6 0z" />
  </svg>
);

// Media res / carcasa: pieza colgada, silueta vertical.
export const IconMediaRes = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3.2v2.4" />
    <path d="M8.4 5.6h7.2c1 0 1.7.9 1.5 1.9l-1.7 9.7a2.4 2.4 0 0 1-2.4 2h-2c-1.2 0-2.2-.8-2.4-2L7 7.5c-.2-1 .5-1.9 1.4-1.9z" />
  </svg>
);

// Menudencias / achuras: piezas surtidas.
export const IconAchuras = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M7.2 6.4c2.3 0 4 1.7 4 3.9s-1.7 4.1-4 4.1-4-1.9-4-4.1 1.7-3.9 4-3.9z" />
    <path d="M15.8 10.6c2.5 0 4.4 2 4.4 4.4s-2 4.2-4.4 4.2-4.3-1.9-4.3-4.2 1.9-4.4 4.3-4.4z" />
  </svg>
);

// Trimming / carne picada: recortes.
export const IconTrimming = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4.6 12.8c0-3.6 3.2-6.6 7.4-6.6s7.4 3 7.4 6.6-3.2 5.6-7.4 5.6-7.4-2-7.4-5.6z" />
    <path d="M9 10.6h.01M12.6 13h.01M10 14.8h.01M14.4 10.4h.01" strokeWidth={2} />
  </svg>
);
