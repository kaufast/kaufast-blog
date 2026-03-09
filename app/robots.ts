import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/static/", "/_next/image/", "/api/"],
      },
    ],
    sitemap: "https://kaufast.com/sitemap-blog.xml",
  };
}
