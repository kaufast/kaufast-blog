import { redirect } from "next/navigation";
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
} from "@/lib/structured-data";
import { getDictionary } from "@/i18n/config";
import styles from "./blog-detail.module.css";

function toISODate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? date : parsed.toISOString();
}

type Params = { locale: string; slug: string };

/** Locales with their own blog content directories. */
const contentLocales = ["en-GB", "en-US", "es-ES", "es-MX", "de-DE", "de-AT", "sr-RS"] as const;

/** Revalidate dynamic pages daily so canonical/hreflang changes propagate. */
export const revalidate = 86400;

export async function generateStaticParams() {
  const params: Params[] = [];

  // Only pre-build for locales that have native content.
  // Other locales are rendered dynamically with canonical → en-GB.
  for (const locale of contentLocales) {
    const posts = getAllPosts(locale);
    for (const post of posts) {
      params.push({ locale, slug: post.slug });
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
  const availableLocales = getAvailableLocalesForArticle(locale, slug);
  const alternates = getArticleAlternates(locale, slugsByLocale, availableLocales);

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
      images: frontmatter.image
        ? [blogImageUrl(frontmatter.image)]
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
  if (!post) redirect(`/${locale}/insights`);

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
  const faqSchema =
    frontmatter.faq && frontmatter.faq.length > 0
      ? generateFAQSchema(frontmatter.faq)
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
      <aside className={styles.authorBio}>
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
              <span className={styles.authorName}>{frontmatter.author}</span>
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
      <div className={styles.cta}>
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
