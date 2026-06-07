import type { MetadataRoute } from "next";
import { getAllPosts, getSlugAlternates, getAvailableLocalesForArticle } from "@/lib/blog";
import { locales, defaultLocale } from "@/i18n/config";
import { getLocalizedUrl } from "@/lib/seo";

/** Locales that have their own blog content directories. */
const contentLocales = ["en-GB", "en-US", "es-ES", "es-MX", "de-DE", "de-AT", "sr-RS"] as const;

export const revalidate = 86400;

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
      const availableLocales = getAvailableLocalesForArticle(contentLocale, post.slug);
      const lastmod = post.frontmatter.lastmod || post.frontmatter.date;

      // Build hreflang only for locales with actual content
      const languages: Record<string, string> = {};
      for (const loc of availableLocales) {
        const locSlug = slugsByLocale[loc];
        languages[loc] = getLocalizedUrl(loc, `/insights/${locSlug}`);
      }
      languages["x-default"] = getLocalizedUrl(
        defaultLocale,
        `/insights/${slugsByLocale["en-GB"]}`
      );

      const parsedDate = lastmod ? new Date(lastmod) : null;
      const lastModified =
        parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

      entries.push({
        url: getLocalizedUrl(contentLocale, `/insights/${post.slug}`),
        lastModified,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
