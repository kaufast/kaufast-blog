import type { Metadata } from "next";
import Link from "next/link";

import { getAllPosts, SECTIONS, getPostsBySection } from "@/lib/blog";
import { getAlternatesForLocale } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/config";
import InsightsClient from "./InsightsClient";
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
  const posts = getAllPosts(locale).filter((p) => p.isNativeContent);

  const sectionTitles: Record<string, { title: string; desc: string }> = {
    seo: { title: dict.meta.seoSectionTitle, desc: dict.meta.seoSectionDescription },
    performance: { title: dict.meta.performanceSectionTitle, desc: dict.meta.performanceSectionDescription },
    "data-privacy": { title: dict.meta.dataPrivacySectionTitle, desc: dict.meta.dataPrivacySectionDescription },
  };

  const breadcrumbSchema = generateBreadcrumbSchema(locale, [
    { name: dict.blog.breadcrumbHome, url: `/${locale}` },
    { name: dict.blog.breadcrumbInsights },
  ]);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{dict.meta.insightsTitle}</h1>
        <p className={styles.pageDescription}>
          {dict.meta.insightsDescription}
        </p>
      </header>

      {/* Section hub */}
      <nav className={styles.sectionHub} aria-label={dict.blog.exploreByTopic}>
        <p className={styles.sectionHubLabel}>{dict.blog.exploreByTopic}</p>
        <div className={styles.sectionCards}>
          {SECTIONS.map((section) => {
            const count = getPostsBySection(locale, section.slug).filter((p) => p.isNativeContent).length;
            return (
              <div
                key={section.slug}
                className={styles.sectionCard}
              >
                <Link href={`/${locale}/insights/${section.slug}`} className={`${styles.sectionCardTitle} ${styles.stretchedLink}`}>
                  {sectionTitles[section.slug]?.title ?? section.title}
                </Link>
                <span className={styles.sectionCardDesc}>{sectionTitles[section.slug]?.desc ?? section.description}</span>
                <span className={styles.sectionCardCount}>{count} {dict.blog.articlesLabel} →</span>
              </div>
            );
          })}
        </div>
      </nav>

      <InsightsClient
        posts={posts}
        locale={locale}
        labels={{
          all: dict.blog.filterAll,
          readMore: dict.blog.readMore,
          minRead: dict.blog.minRead,
          tabLatest: dict.blog.tabLatest,
          tabNewest: dict.blog.tabNewest,
          tabPopular: dict.blog.tabPopular,
          searchPlaceholder: dict.blog.searchPlaceholder,
          searchNoResults: dict.blog.searchNoResults,
          commentsTitle: dict.blog.commentsTitle,
          commentsPlaceholder: dict.blog.commentsPlaceholder,
          commentsSubmit: dict.blog.commentsSubmit,
          commentsEmpty: dict.blog.commentsEmpty,
          commentsName: dict.blog.commentsName,
          commentsPosted: dict.blog.commentsPosted,
        }}
      />
    </main>
  );
}
