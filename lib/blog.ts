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
for (const [key, translations] of Object.entries(slugMap)) {
  for (const [locale, slug] of Object.entries(translations)) {
    reverseSlugMap[`${locale}/${slug}`] = key;
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
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
}

export interface PostSummary {
  slug: string;
  frontmatter: PostFrontmatter;
}

function getLocaleDir(locale: string): string {
  const localeDir = path.join(contentDir, locale);
  if (fs.existsSync(localeDir)) return localeDir;
  return path.join(contentDir, defaultLocale);
}

export function getAllPosts(locale: string): PostSummary[] {
  const dir = getLocaleDir(locale);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    return {
      slug: filename.replace(/\.mdx$/, ""),
      frontmatter: data as PostFrontmatter,
    };
  });

  return posts.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export function getPostBySlug(locale: string, slug: string): Post | null {
  const dir = getLocaleDir(locale);
  const filePath = path.join(dir, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    // Try fallback locale
    const fallbackPath = path.join(contentDir, defaultLocale, `${slug}.mdx`);
    if (!fs.existsSync(fallbackPath)) return null;
    const raw = fs.readFileSync(fallbackPath, "utf-8");
    const { data, content } = matter(raw);
    return { slug, frontmatter: data as PostFrontmatter, content };
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { slug, frontmatter: data as PostFrontmatter, content };
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
  const posts = getAllPosts(locale);
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
