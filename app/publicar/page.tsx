import { redirect } from "next/navigation";

// El formulario viejo de "cotización" quedó obsoleto (modelo marketplace).
// Redirige a la carga de lote dentro de /cuenta. Si no hay sesión, el middleware
// de /cuenta manda a /login.
export default function PublicarRedirect() {
  redirect("/cuenta/publicar");
}
