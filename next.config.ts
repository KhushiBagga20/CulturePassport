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
  experimental: {
    // Image uploads in the editorial desk go through a server action. Vercel caps request bodies
    // at 4.5 MB, so the desk accepts images up to 4 MB (checked again in uploadMediaAction).
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  // Files read from disk at request time, which the bundler cannot see through dynamic paths:
  // Natural Earth boundaries for the maps, and the fonts used to draw identity cards.
  outputFileTracingIncludes: {
    "/country/*": ["./public/geo/*.json"],
    "/passport/*": ["./public/geo/*.json"],
    "/admin/preview/*": ["./public/geo/*.json"],
    "/routes": ["./public/geo/*.json"],
    "/explore": ["./public/geo/*.json"],
    "/api/card/*": ["./node_modules/@fontsource/inter/files/inter-latin-*.woff"],
    "/passport/*/opengraph-image": ["./node_modules/@fontsource/inter/files/inter-latin-*.woff"],
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
