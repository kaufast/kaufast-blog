import type { MetadataRoute } from "next";
import { getAllPosts, getSlugAlternates } from "@/lib/blog";
import { locales, defaultLocale } from "@/i18n/config";
import { getLocalizedUrl } from "@/lib/seo";

/** Locales that have their own blog content directories. */
const contentLocales = ["en-GB", "es-ES"] as const;

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

  // Blog posts — one entry per content locale with correct cross-locale hreflang
  for (const contentLocale of contentLocales) {
    const posts = getAllPosts(contentLocale);

    for (const post of posts) {
      const slugsByLocale = getSlugAlternates(contentLocale, post.slug);
      const lastmod = post.frontmatter.lastmod || post.frontmatter.date;

      // Build hreflang with correct per-locale slugs
      const languages: Record<string, string> = {};
      for (const loc of locales) {
        const locSlug = slugsByLocale[loc];
        languages[loc] = getLocalizedUrl(loc, `/insights/${locSlug}`);
      }
      languages["x-default"] = getLocalizedUrl(
        defaultLocale,
        `/insights/${slugsByLocale["en-GB"]}`
      );

      entries.push({
        url: getLocalizedUrl(contentLocale, `/insights/${post.slug}`),
        lastModified: lastmod ? new Date(lastmod) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
