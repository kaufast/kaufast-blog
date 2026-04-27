import type { Metadata } from "next";

import { getAllPosts } from "@/lib/blog";
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
  const posts = getAllPosts(locale);

  const breadcrumbSchema = generateBreadcrumbSchema(locale, [
    { name: "Home", url: `/${locale}` },
    { name: "Insights" },
  ]);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Insights</h1>
        <p className={styles.pageDescription}>
          {dict.meta.insightsDescription}
        </p>
      </header>

      <InsightsClient
        posts={posts}
        locale={locale}
        labelAll={dict.blog.filterAll}
        labelReadMore={dict.blog.readMore}
        labelMinRead={dict.blog.minRead}
      />
    </main>
  );
}
