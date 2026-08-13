import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/seo";

// Se regenera cada hora para incluir los lotes nuevos sin rebuild.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();

  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: ahora, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/compradores`, lastModified: ahora, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/vendedores`, lastModified: ahora, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/sumate`, lastModified: ahora, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Cada lote público (misma fuente anónima que el catálogo).
  const { data } = await supabase.rpc("catalogo_publico", {});
  const lotes: MetadataRoute.Sitemap = ((data ?? []) as { id: string; created_at: string | null }[]).map(
    (l) => ({
      url: `${SITE_URL}/lote/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  return [...base, ...lotes];
}
