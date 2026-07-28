import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DeCarnes",
    short_name: "DeCarnes",
    description: "El mercado de la carne, en un solo lugar. Powered by MBEEF.",
    start_url: "/",
    display: "standalone",
    background_color: "#1d1d1b",
    theme_color: "#b30e2a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
