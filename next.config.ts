import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];

const noIndexRoutes = [
  "/auth/:path*",
  "/seeker/:path*",
  "/feed/:path*",
  "/network/:path*",
  "/messages/:path*",
  "/notifications/:path*",
  "/profile/:path*",
  "/jobs/:path*",
  "/applications/:path*",
  "/saved/:path*",
  "/settings/:path*",
  "/resume/:path*",
  "/open-to-work/:path*",
  "/support/:path*",
  "/change-role/:path*",
];

const nextConfig: NextConfig = {
  trailingSlash: false,
  crossOrigin: "anonymous",
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      ...noIndexRoutes.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
  async rewrites() {
    return [
      {
        source: "/authController/:path*",
        destination: "https://edge.jobkar.in/authentication/authController/:path*",
      },
      {
        source: "/backend/:path*",
        destination: "https://api.jobkar.in/:path*",
      },
    ];
  },
};

export default nextConfig;
