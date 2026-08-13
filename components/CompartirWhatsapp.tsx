// Botón para COMPARTIR un link por WhatsApp (reenviar a un contacto, sin número
// destino). Distinto de consultar al vendedor: acá se comparte la página, y
// WhatsApp arma la portada + descripción con los metadatos Open Graph del link.
export default function CompartirWhatsapp({
  texto,
  url,
  label = "Compartir por WhatsApp",
  full = false,
}: {
  texto: string;
  url: string;
  label?: string;
  full?: boolean;
}) {
  const href = `https://wa.me/?text=${encodeURIComponent(`${texto}\n${url}`)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 border border-exito/40 px-5 py-2.5 text-sm text-exito transition-colors hover:bg-exito/10 ${full ? "w-full" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.477-.917z" />
      </svg>
      {label}
    </a>
  );
}
