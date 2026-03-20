import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import Link from "next/link";

import {
  getPostBySlug,
  getAllSlugs,
  getAdjacentPosts,
  estimateReadingTime,
  getSlugAlternates,
} from "@/lib/blog";
import { getArticleAlternates, SITE_URL } from "@/lib/seo";
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
} from "@/lib/structured-data";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/config";
import styles from "./blog-detail.module.css";

type Params = { locale: string; slug: string };

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  const params: Params[] = [];

  for (const locale of locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale, slug);
  if (!post) return {};

  const { frontmatter } = post;
  const slugsByLocale = getSlugAlternates(locale, slug);
  const alternates = getArticleAlternates(locale, slugsByLocale);

  return {
    title: `${frontmatter.title} — KAUFAST`,
    description: frontmatter.headline,
    alternates,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.headline,
      url: alternates.canonical,
      type: "article",
      publishedTime: frontmatter.date,
      modifiedTime: frontmatter.lastmod,
      images: frontmatter.image
        ? [`${SITE_URL}${frontmatter.image}`]
        : undefined,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale, slug);
  if (!post) notFound();

  const dict = await getDictionary(locale);
  const { frontmatter, content } = post;
  const readingTime = estimateReadingTime(content);
  const { prev, next } = getAdjacentPosts(locale, slug);

  const articleSchema = generateArticleSchema(locale, {
    ...frontmatter,
    slug,
  });
  const breadcrumbSchema = generateBreadcrumbSchema(locale, [
    { name: "Home", url: `/${locale}` },
    { name: "Insights", url: `/${locale}/insights` },
    { name: frontmatter.title },
  ]);

  return (
    <article className={styles.article}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href={`/${locale}`}>Home</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <Link href={`/${locale}/insights`}>Insights</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{frontmatter.title}</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <span className={styles.category}>{frontmatter.category}</span>
        <h1 className={styles.title}>{frontmatter.title}</h1>
        <p className={styles.headline}>{frontmatter.headline}</p>
        <div className={styles.meta}>
          <span>
            {dict.blog.by} {frontmatter.author}
          </span>
          <span className={styles.metaDot} />
          <span>{frontmatter.date}</span>
          <span className={styles.metaDot} />
          <span>
            {readingTime} {dict.blog.minRead}
          </span>
          {frontmatter.lastmod && frontmatter.lastmod !== frontmatter.date && (
            <>
              <span className={styles.metaDot} />
              <span>
                {dict.blog.updated} {frontmatter.lastmod}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Hero Image */}
      {frontmatter.image && (
        <img
          className={styles.heroImage}
          src={frontmatter.image}
          alt={frontmatter.title}
          loading="eager"
        />
      )}

      {/* Content */}
      <div className={styles.prose}>
        <MDXRemote source={content} />
      </div>

      {/* Tags */}
      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div className={styles.tags}>
          {frontmatter.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className={styles.cta}>
        <h2 className={styles.ctaTitle}>{dict.blog.ctaTitle}</h2>
        <p className={styles.ctaText}>{dict.blog.ctaText}</p>
        <a
          href={`https://kaufast.com/${locale}/contact`}
          className={styles.ctaButton}
        >
          {dict.blog.ctaButton}
        </a>
      </div>

      {/* Adjacent Posts */}
      {(prev || next) && (
        <nav className={styles.adjacentPosts}>
          {prev ? (
            <Link
              href={`/${locale}/insights/${prev.slug}`}
              className={styles.adjacentPost}
            >
              <div className={styles.adjacentLabel}>{dict.blog.prev}</div>
              <div className={styles.adjacentTitle}>
                {prev.frontmatter.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/${locale}/insights/${next.slug}`}
              className={`${styles.adjacentPost} ${styles.adjacentPostNext}`}
            >
              <div className={styles.adjacentLabel}>{dict.blog.next}</div>
              <div className={styles.adjacentTitle}>
                {next.frontmatter.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      )}
    </article>
  );
}
