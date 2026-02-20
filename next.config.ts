import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const authNoStore = [
      { source: "/login", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/register", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/forgot-password", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/mfa/setup", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/verify-mfa", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
    return [
      ...authNoStore,
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
    default-src 'self';

    script-src 'self' 'unsafe-inline' 'unsafe-eval'
      https://hcaptcha.com
      https://*.hcaptcha.com
      https://player.vimeo.com
      https://*.vimeocdn.com;

    style-src 'self' 'unsafe-inline' https://*.vimeocdn.com;

    img-src 'self' data: blob:
      https://*.supabase.co
      https://i.imgur.com
      https://*.vimeocdn.com;

    frame-src
      https://hcaptcha.com
      https://*.hcaptcha.com
      https://player.vimeo.com;

    connect-src 'self'
      https://*.supabase.co
      https://*.hcaptcha.com
      https://player.vimeo.com
      https://*.vimeocdn.com;

    media-src
      https://player.vimeo.com
      https://*.vimeocdn.com
      https://*.akamaized.net;

    frame-ancestors 'self';

    form-action 'self';

    font-src 'self' data: https:;
  `.replace(/\n/g, ""),
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
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
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
