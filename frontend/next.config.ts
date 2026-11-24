
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mengizinkan gambar dari Cloudinary
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // Konfigurasi eksperimental
  experimental: {
    agentFeedback: true,
  },

  // Cache Components
  cacheComponents: true,

  // Partial Prefetching
  partialPrefetching: true,

  // Konfigurasi Turbopack
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
