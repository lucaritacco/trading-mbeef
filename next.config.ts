import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      // /enterate pasó a ser /compradores (ya estaba indexada y en emails).
      { source: "/enterate", destination: "/compradores", permanent: true },
    ];
  },
};

export default nextConfig;
