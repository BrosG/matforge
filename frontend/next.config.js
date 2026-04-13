/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // Unique build ID per deploy — ensures no ISR cache survives across deployments
  generateBuildId: async () => {
    // Use git SHA if available, otherwise timestamp
    const { execSync } = require("child_process");
    try {
      return execSync("git rev-parse --short=12 HEAD").toString().trim();
    } catch {
      return `build-${Date.now()}`;
    }
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        // Immutable content-hashed static assets — cache forever
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Next.js data routes (ISR JSON payloads) — never cache in browser
        source: "/_next/data/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        // All HTML pages — never cache, always get fresh from server
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
