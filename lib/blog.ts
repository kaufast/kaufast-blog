import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { defaultLocale, locales } from "@/i18n/config";
import slugMapData from "@/content/blog/slug-map.json";

const contentDir = path.join(process.cwd(), "content", "blog");

// Build reverse lookup: given any locale+slug, find the article's slugs in all locales
const slugMap = slugMapData as Record<string, Record<string, string>>;

// Reverse index: locale/slug → translation key (en-GB slug)
const reverseSlugMap: Record<string, string> = {};
// Any slug (regardless of locale) → en-GB slug for fallback resolution
const slugToDefaultSlug: Record<string, string> = {};
for (const [key, translations] of Object.entries(slugMap)) {
  for (const [locale, slug] of Object.entries(translations)) {
    reverseSlugMap[`${locale}/${slug}`] = key;
    if (!slugToDefaultSlug[slug]) {
      slugToDefaultSlug[slug] = translations["en-GB"] || key;
    }
  }
}

/**
 * Given a locale and slug, returns the correct slug for each locale.
 * For locales without blog content, falls back to the en-GB slug.
 */
export function getSlugAlternates(
  locale: string,
  slug: string
): Record<string, string> {
  const key = reverseSlugMap[`${locale}/${slug}`] || slug;
  const translations = slugMap[key];
  if (!translations) {
    // No mapping found — use same slug for all locales
    const result: Record<string, string> = {};
    for (const loc of locales) {
      result[loc] = slug;
    }
    return result;
  }
  const result: Record<string, string> = {};
  for (const loc of locales) {
    // Use locale-specific slug if available, otherwise fall back to en-GB slug
    result[loc] = translations[loc] || translations["en-GB"] || slug;
  }
  return result;
}

export interface PostFrontmatter {
  title: string;
  headline: string;
  date: string;
  lastmod: string;
  author: string;
  category: string;
  tags: string[];
  image: string;
  featured: boolean;
  audra?: boolean;
  echoflicks?: boolean;
  h1?: string;
  schemaType?: string;
  about?: string[];
  dependencies?: string;
  faq?: { question: string; answer: string }[];
  howto?: {
    name: string;
    description?: string;
    steps: { name: string; text: string }[];
  };
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  /** True when the MDX file was found natively in the requested locale's directory. False when content fell back to en-GB. */
  isNativeContent: boolean;
}

export interface PostSummary {
  slug: string;
  frontmatter: PostFrontmatter;
  readingTime: number;
  /** True when the MDX file lives in the requested locale's own directory. */
  isNativeContent: boolean;
}

function getLocaleDir(locale: string): string {
  const localeDir = path.join(contentDir, locale);
  if (fs.existsSync(localeDir)) return localeDir;
  return path.join(contentDir, defaultLocale);
}

export function getAllPosts(locale: string): PostSummary[] {
  const dir = getLocaleDir(locale);
  if (!fs.existsSync(dir)) return [];

  const isNative = dir === path.join(contentDir, locale);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      slug: filename.replace(/\.mdx$/, ""),
      frontmatter: data as PostFrontmatter,
      readingTime: estimateReadingTime(content),
      isNativeContent: isNative,
    };
  });

  return posts.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export function getPostBySlug(locale: string, slug: string): Post | null {
  // Check if the MDX file exists natively in the requested locale's directory
  const nativePath = path.join(contentDir, locale, `${slug}.mdx`);
  if (fs.existsSync(nativePath)) {
    const raw = fs.readFileSync(nativePath, "utf-8");
    const { data, content } = matter(raw);
    return { slug, frontmatter: data as PostFrontmatter, content, isNativeContent: true };
  }

  // Resolve via slug map (e.g. es-ES slug → en-GB equivalent) — still native if the
  // resolved slug lives in the same locale's directory.
  const defaultSlug = slugToDefaultSlug[slug];
  if (defaultSlug && defaultSlug !== slug) {
    const resolvedNativePath = path.join(contentDir, locale, `${defaultSlug}.mdx`);
    if (fs.existsSync(resolvedNativePath)) {
      const raw = fs.readFileSync(resolvedNativePath, "utf-8");
      const { data, content } = matter(raw);
      return { slug, frontmatter: data as PostFrontmatter, content, isNativeContent: true };
    }
  }

  // ── Fallback to en-GB ────────────────────────────────────────────────────
  // Content does not exist for this locale. We still load it so callers can
  // decide what to do (e.g. return 404 for non-default locales), but we mark
  // isNativeContent: false so the page component can call notFound().

  // Try fallback locale with same slug
  const fallbackPath = path.join(contentDir, defaultLocale, `${slug}.mdx`);
  if (fs.existsSync(fallbackPath)) {
    const raw = fs.readFileSync(fallbackPath, "utf-8");
    const { data, content } = matter(raw);
    return { slug, frontmatter: data as PostFrontmatter, content, isNativeContent: false };
  }

  // Try slug map resolution against en-GB
  if (defaultSlug && defaultSlug !== slug) {
    const resolvedPath = path.join(contentDir, defaultLocale, `${defaultSlug}.mdx`);
    if (fs.existsSync(resolvedPath)) {
      const raw = fs.readFileSync(resolvedPath, "utf-8");
      const { data, content } = matter(raw);
      return { slug, frontmatter: data as PostFrontmatter, content, isNativeContent: false };
    }
  }

  return null;
}

export function getAllSlugs(): string[] {
  const allSlugs = new Set<string>();

  for (const locale of locales) {
    const dir = path.join(contentDir, locale);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
      allSlugs.add(f.replace(/\.mdx$/, ""));
    }
  }

  return Array.from(allSlugs);
}

export function getAdjacentPosts(
  locale: string,
  slug: string
): { prev: PostSummary | null; next: PostSummary | null } {
  const posts = getAllPosts(locale).filter((p) => p.isNativeContent);
  const index = posts.findIndex((p) => p.slug === slug);

  if (index === -1) return { prev: null, next: null };

  return {
    prev: index < posts.length - 1 ? posts[index + 1] : null,
    next: index > 0 ? posts[index - 1] : null,
  };
}

export function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

/** Maps a category value to the matching section slug for internal links. */
export function categoryToSection(category: string): SectionSlug {
  if (category === "Performance") return "performance";
  if (category === "Data Privacy & Compliance") return "data-privacy";
  return "seo";
}

/**
 * Returns up to `limit` related posts in the same locale:
 * - First: same category, excluding current slug.
 * - Fill-up: most recent native posts from any category if fewer than `limit`.
 */
export function getRelatedPosts(
  locale: string,
  currentSlug: string,
  category: string,
  limit = 3
): PostSummary[] {
  const all = getAllPosts(locale).filter(
    (p) => p.isNativeContent && p.slug !== currentSlug
  );

  const sameCategory = all.filter((p) => p.frontmatter.category === category);
  const others = all.filter((p) => p.frontmatter.category !== category);

  const result = [...sameCategory, ...others].slice(0, limit);
  return result;
}

// ─── Section config ────────────────────────────────────────────────────────

export type SectionSlug = "seo" | "performance" | "data-privacy";

export interface SectionInfo {
  slug: SectionSlug;
  title: string;
  description: string;
  /** If set, only include posts whose category is in this list. */
  categories?: string[];
  /** If set (and no `categories`), exclude posts in these categories. */
  excludeCategories?: string[];
}

export const SECTIONS: SectionInfo[] = [
  {
    slug: "seo",
    title: "SEO & Digital Growth",
    description:
      "AI visibility, search strategy, and tactics to grow organic traffic and convert more visitors.",
    excludeCategories: ["Performance", "Data Privacy & Compliance"],
  },
  {
    slug: "performance",
    title: "Web Performance",
    description:
      "Site speed, Core Web Vitals, and performance optimisations that boost rankings and revenue.",
    categories: ["Performance"],
  },
  {
    slug: "data-privacy",
    title: "Data Privacy",
    description:
      "GDPR compliance, data protection obligations, and privacy best practices for businesses.",
    categories: ["Data Privacy & Compliance"],
  },
];

export function getPostsBySection(
  locale: string,
  section: SectionSlug
): PostSummary[] {
  const config = SECTIONS.find((s) => s.slug === section);
  if (!config) return [];
  const all = getAllPosts(locale);
  if (config.categories) {
    return all.filter((p) => config.categories!.includes(p.frontmatter.category));
  }
  if (config.excludeCategories) {
    return all.filter(
      (p) => !config.excludeCategories!.includes(p.frontmatter.category)
    );
  }
  return all;
}

/**
 * Returns the locales that have actual content for a given article.
 * A locale "has content" if it appears in the slug map for this article
 * OR has a native .mdx file in its content directory.
 */
export function getAvailableLocalesForArticle(
  locale: string,
  slug: string
): string[] {
  // Find the article key via reverse slug map
  const key = reverseSlugMap[`${locale}/${slug}`] || slug;
  const translations = slugMap[key];

  const available = new Set<string>();

  if (translations) {
    // All locales in the slug map have real content (or translations)
    for (const loc of Object.keys(translations)) {
      available.add(loc);
    }
  }

  // Also check if the file exists directly in any content dir
  for (const loc of locales) {
    const filePath = path.join(contentDir, loc, `${slug}.mdx`);
    if (fs.existsSync(filePath)) {
      available.add(loc);
    }
  }

  // Ensure at least en-GB is included
  if (available.size === 0) {
    const enPath = path.join(contentDir, defaultLocale, `${slug}.mdx`);
    if (fs.existsSync(enPath)) {
      available.add(defaultLocale);
    }
  }

  return Array.from(available);
}
