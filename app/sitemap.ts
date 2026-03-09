import type { MetadataRoute } from "next";
import { getAllPosts, getAllSlugs } from "@/lib/blog";
import { locales, defaultLocale } from "@/i18n/config";
import { SITE_URL, getLocalizedUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Listing pages — one per locale
  for (const locale of locales) {
    const languages: Record<string, string> = {};
    for (const loc of locales) {
      languages[loc] = getLocalizedUrl(loc, "/insights");
    }
    languages["x-default"] = getLocalizedUrl(defaultLocale, "/insights");

    entries.push({
      url: getLocalizedUrl(locale, "/insights"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages },
    });
  }

  // Blog posts — all slugs × all locales
  const slugs = getAllSlugs();
  const posts = getAllPosts(defaultLocale);

  for (const slug of slugs) {
    const post = posts.find((p) => p.slug === slug);
    const lastmod = post?.frontmatter.lastmod || post?.frontmatter.date;

    for (const locale of locales) {
      const languages: Record<string, string> = {};
      for (const loc of locales) {
        languages[loc] = getLocalizedUrl(loc, `/insights/${slug}`);
      }
      languages["x-default"] = getLocalizedUrl(
        defaultLocale,
        `/insights/${slug}`
      );

      entries.push({
        url: getLocalizedUrl(locale, `/insights/${slug}`),
        lastModified: lastmod ? new Date(lastmod) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
