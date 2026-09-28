import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "assets.mixkit.co" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
    // Media uploads (video / 360° frame sets) stream through /api/admin/media.
    proxyClientMaxBodySize: "150mb",
  },
};

export default nextConfig;
