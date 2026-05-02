import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // unsafe-inline required: admin layout service-worker script, inline animation styles in wholesale portal
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com https://maps.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // blob: for PDF generation; https: for sticker images served from own domain
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.resend.com https://maps.googleapis.com",
  "frame-src https://js.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy",            value: CSP },
  { key: "Strict-Transport-Security",          value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options",                    value: "DENY" },
  { key: "X-Content-Type-Options",             value: "nosniff" },
  { key: "Referrer-Policy",                    value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control",             value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Cache control for sticker images — 7-day CDN cache
      {
        source: "/stickers/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
