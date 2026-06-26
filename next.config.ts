import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // ─── Security Headers (defense in depth, also enforced via proxy.ts) ───
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  // ─── Power-by header obfuscation (don't leak Next.js version) ───
  poweredByHeader: false,

  // ─── Production-only optimizations ───
  productionBrowserSourceMaps: false,
};

// Sentry wrapping is handled via instrumentation.ts + sentry.*.config.ts files.
// No need for withSentryConfig wrapper here (it causes top-level await issues with Turbopack).
export default nextConfig;
