import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Imágenes de anuncios desde el panel de admin (Vercel corta en 4,5 MB)
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
