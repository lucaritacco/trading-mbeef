import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DeCarnes",
    short_name: "DeCarnes",
    description: "El mercado de la carne, en un solo lugar. Powered by MBEEF.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#8C1522",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
