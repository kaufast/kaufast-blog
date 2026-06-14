import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import Link from "next/link";

import {
  getPostBySlug,
  getAllPosts,
  getAdjacentPosts,
  estimateReadingTime,
  getSlugAlternates,
  getAvailableLocalesForArticle,
} from "@/lib/blog";
import { getArticleAlternates, blogImageUrl } from "@/lib/seo";
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
} from "@/lib/structured-data";
import { getDictionary } from "@/i18n/config";
import remarkGfm from "remark-gfm";
import styles from "./blog-detail.module.css";

function toISODate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  const parsed = new Date(date + " UTC");
  return isNaN(parsed.getTime()) ? date : parsed.toISOString();
}

type Params = { locale: string; slug: string };

/** Locales with their own blog content directories. */
const contentLocales = ["en-GB", "en-US", "es-ES", "es-MX", "ca-ES", "de-DE", "de-AT", "fr-FR", "it-IT", "pt-BR", "pt-PT", "sr-RS", "ru-RU"] as const;

/** Revalidate dynamic pages daily so canonical/hreflang changes propagate. */
export const revalidate = 86400;

export async function generateStaticParams() {
  const params: Params[] = [];

  // Only pre-build locale+slug combos where an MDX file actually exists in
  // that locale's own content directory. getAllPosts() falls back to en-GB for
  // locales without their own directory, which would generate duplicate-content
  // static pages — so we guard with getPostBySlug().isNativeContent instead.
  for (const locale of contentLocales) {
    const posts = getAllPosts(locale);
    for (const post of posts) {
      const resolved = getPostBySlug(locale, post.slug);
      if (resolved?.isNativeContent) {
        params.push({ locale, slug: post.slug });
      }
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
  // No content at all, or content only exists in en-GB (fallback) — treat as 404.
  if (!post || !post.isNativeContent) return {};

  const { frontmatter } = post;
  const slugsByLocale = getSlugAlternates(locale, slug);
  const availableLocales = getAvailableLocalesForArticle(locale, slug);
  const alternates = getArticleAlternates(locale, slugsByLocale, availableLocales);

  const ogImage = frontmatter.image ? [blogImageUrl(frontmatter.image)] : undefined;

  return {
    title: frontmatter.title,
    description: frontmatter.headline,
    alternates,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.headline,
      url: alternates.canonical,
      type: "article",
      publishedTime: toISODate(frontmatter.date),
      modifiedTime: toISODate(frontmatter.lastmod),
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.headline,
      images: ogImage,
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
  // No content at all, or content only exists in en-GB (fallback) — 404 so
  // search engines never see duplicate English content under a non-en-GB URL.
  if (!post || !post.isNativeContent) notFound();

  const dict = await getDictionary(locale);
  const { frontmatter, content } = post;
  const readingTime = estimateReadingTime(content);
  const { prev, next } = getAdjacentPosts(locale, slug);

  const articleSchema = generateArticleSchema(locale, {
    ...frontmatter,
    slug,
  });
  const breadcrumbSchema = generateBreadcrumbSchema(locale, [
    { name: dict.blog.breadcrumbHome, url: `/${locale}` },
    { name: dict.blog.breadcrumbInsights, url: `/${locale}/insights` },
    { name: frontmatter.title },
  ]);
  const faqSchema =
    frontmatter.faq && frontmatter.faq.length > 0
      ? generateFAQSchema(frontmatter.faq)
      : null;
  const howtoSchema = frontmatter.howto
    ? generateHowToSchema(frontmatter.howto)
    : null;

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}
      {howtoSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(howtoSchema),
          }}
        />
      )}

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href={`/${locale}`}>{dict.blog.breadcrumbHome}</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <Link href={`/${locale}/insights`}>{dict.blog.breadcrumbInsights}</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{frontmatter.title}</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <span className={styles.category}>{frontmatter.category}</span>
        <h1 className={styles.title}>{frontmatter.h1 || frontmatter.title}</h1>
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
          src={blogImageUrl(frontmatter.image)}
          alt={frontmatter.title}
          loading="eager"
        />
      )}

      {/* Content */}
      <div className={styles.prose}>
        <MDXRemote
          source={content}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          components={{
            img: (props) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                {...props}
                src={blogImageUrl(props.src ?? "")}
                alt={props.alt ?? ""}
              />
            ),
          }}
        />
      </div>

      {/* FAQ Section */}
      {frontmatter.faq && frontmatter.faq.length > 0 && (
        <section className={styles.faqSection}>
          <h2 className={styles.faqTitle}>{dict.blog.faqTitle}</h2>
          <dl className={styles.faqList}>
            {frontmatter.faq.map((item, i) => (
              <div key={i} className={styles.faqItem}>
                <dt className={styles.faqQuestion}>{item.question}</dt>
                <dd className={styles.faqAnswer}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Author Bio */}
      <aside className={styles.authorBio} data-nosnippet>
        <div className={styles.authorBioInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.kaufast.com/team/kenneth-melchor.webp"
            alt={frontmatter.author}
            width={48}
            height={48}
            className={styles.authorAvatar}
          />
          <div className={styles.authorContent}>
            <div className={styles.authorInfo}>
              <a href={`/${locale}/kenneth-melchor`} className={styles.authorName}>{frontmatter.author}</a>
              <span className={styles.authorRole}>{dict.blog.authorRole}</span>
            </div>
            <p className={styles.authorDescription}>{dict.blog.authorBio}</p>
          </div>
        </div>
      </aside>

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
      <div className={styles.cta} data-nosnippet>
        {frontmatter.audra ? (
          <>
            <h2 className={styles.ctaTitle}>Audra</h2>
            <p className={styles.ctaText}>
              Global safety for women. Privacy-first. Available on iOS &amp; Android.
            </p>
            <a
              href="https://audra.uk"
              className={styles.ctaButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Audra
            </a>
          </>
        ) : frontmatter.echoflicks ? (
          <>
            <h2 className={styles.ctaTitle}>Echoflicks</h2>
            <p className={styles.ctaText}>
              Turn your photos into cinematic movies. Send them to Felix on WhatsApp.
            </p>
            <a
              href="https://echoflicks.com"
              className={styles.ctaButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Try Echoflicks
            </a>
          </>
        ) : (
          <>
            <h2 className={styles.ctaTitle}>{dict.blog.ctaTitle}</h2>
            <p className={styles.ctaText}>{dict.blog.ctaText}</p>
            <a
              href={`https://kaufast.com/${locale}/contact`}
              className={styles.ctaButton}
            >
              {dict.blog.ctaButton}
            </a>
          </>
        )}
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
