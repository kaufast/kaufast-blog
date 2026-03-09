import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { defaultLocale } from "@/i18n/config";

const contentDir = path.join(process.cwd(), "content", "blog");

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
  const dir = path.join(contentDir, defaultLocale);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
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
