import type { Metadata } from "next";
import Link from "next/link";

import { getAllPosts, estimateReadingTime, getPostBySlug } from "@/lib/blog";
import { getAlternatesForLocale, blogImageUrl } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/config";
import styles from "./insights.module.css";

type Params = { locale: string };

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const alternates = getAlternatesForLocale(locale, "/insights");

  return {
    title: dict.meta.insightsTitle,
    description: dict.meta.insightsDescription,
    alternates,
    openGraph: {
      title: dict.meta.insightsTitle,
      description: dict.meta.insightsDescription,
      url: `https://kaufast.com/${locale}/insights`,
      siteName: "KAUFAST",
      images: [{ url: "/images/og-default.webp", width: 1200, height: 630, alt: dict.meta.insightsTitle }],
      locale: locale.replace("-", "_"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.insightsTitle,
      description: dict.meta.insightsDescription,
      images: ["/images/og-default.webp"],
    },
  };
}

export default async function InsightsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const posts = getAllPosts(locale);

  const featured = posts.filter((p) => p.frontmatter.featured);
  const latest = posts.filter((p) => !p.frontmatter.featured);

  const breadcrumbSchema = generateBreadcrumbSchema(locale, [
    { name: "Home", url: `/${locale}` },
    { name: "Insights" },
  ]);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Insights</h1>
        <p className={styles.pageDescription}>
          {dict.meta.insightsDescription}
        </p>
      </header>

      {/* Featured Posts */}
      {featured.length > 0 && (
        <section>
          <div className={styles.sectionLabel}>{dict.blog.featured}</div>
          <div className={styles.featuredGrid}>
            {featured.map((post) => (
              <PostCard
                key={post.slug}
                post={post}
                locale={locale}
                dict={dict}
              />
            ))}
          </div>
        </section>
      )}

      {/* Latest Posts */}
      <section>
        <div className={styles.sectionLabel}>{dict.blog.latest}</div>
        <div className={styles.postsGrid}>
          {latest.map((post) => (
            <PostCard
              key={post.slug}
              post={post}
              locale={locale}
              dict={dict}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function PostCard({
  post,
  locale,
  dict,
}: {
  post: { slug: string; frontmatter: import("@/lib/blog").PostFrontmatter };
  locale: string;
  dict: Awaited<ReturnType<typeof getDictionary>>;
}) {
  // Estimate reading time from slug — we only have summary here
  // Use headline length as rough proxy (real reading time computed on detail page)
  const words = post.frontmatter.headline.split(/\s+/).length;
  const estimatedMin = Math.max(5, Math.ceil(words / 2)); // blog posts are typically 5-15 min

  return (
    <Link
      href={`/${locale}/insights/${post.slug}`}
      className={styles.card}
    >
      {post.frontmatter.image && (
        <img
          className={styles.cardImage}
          src={blogImageUrl(post.frontmatter.image)}
          alt={post.frontmatter.title}
          loading="lazy"
        />
      )}
      <div className={styles.cardBody}>
        <div className={styles.cardCategory}>
          {post.frontmatter.category}
        </div>
        <h2 className={styles.cardTitle}>{post.frontmatter.title}</h2>
        <p className={styles.cardExcerpt}>{post.frontmatter.headline}</p>
        <div className={styles.cardMeta}>
          <span>{post.frontmatter.date}</span>
          <span className={styles.cardMetaDot} />
          <span>{dict.blog.readMore}</span>
        </div>
      </div>
    </Link>
  );
}
