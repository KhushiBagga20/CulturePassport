import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Archival photographs are referenced from Wikimedia Commons (credited per licence).
    remotePatterns: [{ protocol: "https", hostname: "upload.wikimedia.org" }],
  },
  async headers() {
    return [
      {
        source: "/geo/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
