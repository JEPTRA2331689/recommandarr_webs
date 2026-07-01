import type { NextConfig } from "next";

const securityHeaders = [
  // Empêche l'embarquement dans un iframe (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche le MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ne transmet pas l'URL complète (protège les clés API en query string) dans le header Referer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Désactive les API browser sensibles non utilisées
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Force HTTPS en production (ignoré en localhost)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // CSP restrictive — ajuste les sources si tu ajoutes des CDN
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval nécessaire pour Next.js dev/Turbopack
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://image.tmdb.org",
      "connect-src 'self' https://localhost:7148 http://localhost:7148",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "https://recommandarr-production.up.railway.app/api/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
