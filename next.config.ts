import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  assetPrefix: "https://kaufast-blog.vercel.app",

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No X-Robots-Tag here. All blog pages carry canonical tags pointing to
          // kaufast.com/*/insights/* — Google respects canonical and will not index
          // kaufast-blog.vercel.app. Adding noindex was wrong: Next.js forwards
          // response headers through the proxy rewrite, so it blocked kaufast.com too.
        ],
      },
    ];
  },

};

export default nextConfig;
