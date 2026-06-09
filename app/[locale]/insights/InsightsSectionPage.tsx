import Link from "next/link";
import { getPostsBySection, SECTIONS, type SectionSlug } from "@/lib/blog";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { getDictionary } from "@/i18n/config";
import InsightsClient from "./InsightsClient";
import styles from "./insights.module.css";

type Props = {
  locale: string;
  section: SectionSlug;
};

export default async function InsightsSectionPage({ locale, section }: Props) {
  const config = SECTIONS.find((s) => s.slug === section)!;
  const dict = await getDictionary(locale);
  const posts = getPostsBySection(locale, section);

  const breadcrumbSchema = generateBreadcrumbSchema(locale, [
    { name: "Home", url: `/${locale}` },
    { name: "Insights", url: `/${locale}/insights` },
    { name: config.title },
  ]);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className={styles.sectionBreadcrumb} aria-label="Breadcrumb">
        <Link href={`/${locale}/insights`}>Insights</Link>
        <span className={styles.sectionBreadcrumbSep}>/</span>
        <span>{config.title}</span>
      </nav>

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{config.title}</h1>
        <p className={styles.pageDescription}>{config.description}</p>
      </header>

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
