import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  assetPrefix: "https://kaufast-blog.vercel.app",

  async headers() {
    return [
      {
        // Security headers applied to all routes
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Block direct indexing of the blog subdomain — content is canonical on kaufast.com.
        // Scoped to kaufast-blog.vercel.app host so this header is NOT forwarded when
        // Next.js proxies the content through kaufast.com/*/insights.
        source: "/(.*)",
        has: [{ type: "host", value: "kaufast-blog.vercel.app" }],
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },

};

export default nextConfig;
