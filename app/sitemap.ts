import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://decarnesonline.com";

// Se regenera cada hora para incluir los lotes nuevos sin rebuild.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/mercado`, changeFrequency: "daily", priority: 0.9 },
  ];

  // Cada lote público (misma fuente anónima que el catálogo).
  const { data } = await supabase.rpc("catalogo_publico", {});
  const lotes: MetadataRoute.Sitemap = ((data ?? []) as { id: string; created_at: string | null }[]).map(
    (l) => ({
      url: `${SITE}/lote/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  return [...base, ...lotes];
}
