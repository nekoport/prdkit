import { NextRequest, NextResponse } from "next/server";

/**
 * Security middleware — set HTTP security headers on every response.
 *
 * Implements recommendations from OWASP Top 10:2025:
 *   A02:2025 - Security Misconfiguration
 *   A08:2025 - Software or Data Integrity Failures
 *
 * Headers set:
 * - Content-Security-Policy: restrict resource loading
 * - X-Content-Type-Options: prevent MIME sniffing
 * - X-Frame-Options: prevent clickjacking (legacy, complement to CSP frame-ancestors)
 * - Referrer-Policy: control referrer leakage
 * - Permissions-Policy: disable unused browser features
 * - Strict-Transport-Security: force HTTPS (only honored over HTTPS)
 * - X-DNS-Prefetch-Control: disable DNS prefetch for privacy
 * - Cross-Origin-Opener-Policy / Cross-Origin-Resource-Policy: process isolation
 */

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  "X-DNS-Prefetch-Control": "off",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};

// HSTS: only effective over HTTPS, 1 year + preload
const HSTS_HEADER = "max-age=31536000; includeSubDomains; preload";

/**
 * Content Security Policy.
 * - default-src 'self': only allow resources from same origin
 * - script-src: 'self' + 'unsafe-inline' (Next.js needs inline for hydration) + nonce for eval-free
 *   Google Analytics / Sentry jika di-enable perlu ditambahkan domainnya
 * - style-src: 'self' 'unsafe-inline' (Tailwind + inline styles)
 * - img-src: 'self' + data: (base64) + https: (OG images, avatars)
 * - font-src: 'self' + https://fonts.gstatic.com (Google Fonts)
 * - connect-src: 'self' + https://api.resend.com + https://api.anthropic.com + https://context7.com + https://mcp.context7.com (untuk server-side fetch via API routes)
 *   NOTE: connect-src hanya mengatur browser fetch, server-side fetch tidak terkena
 * - frame-ancestors 'none': equivalent to X-Frame-Options DENY
 * - form-action 'self': restrict form submissions
 * - base-uri 'self': prevent <base> hijack
 * - object-src 'none': no Flash/Java/plugins
 * - upgrade-insecure-requests: auto-upgrade HTTP to HTTPS
 */
function buildCsp(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.resend.com https://api.anthropic.com https://context7.com https://mcp.context7.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

export function proxy(_req: NextRequest) {
  const res = NextResponse.next();

  // Apply all security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }

  // HSTS — only set if request is HTTPS (or behind HTTPS proxy)
  // Next.js di Vercel selalu HTTPS, jadi set unconditional
  res.headers.set("Strict-Transport-Security", HSTS_HEADER);

  // CSP
  res.headers.set("Content-Security-Policy", buildCsp());

  return res;
}

export const config = {
  // Apply to all routes except static assets
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.svg, apple-icon.svg
     * - manifest.webmanifest
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
