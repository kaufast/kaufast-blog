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

  const sectionTitles: Record<string, { title: string; desc: string; intro: string }> = {
    seo: { title: dict.meta.seoSectionTitle, desc: dict.meta.seoSectionDescription, intro: dict.meta.seoSectionIntro },
    performance: { title: dict.meta.performanceSectionTitle, desc: dict.meta.performanceSectionDescription, intro: dict.meta.performanceSectionIntro },
    "data-privacy": { title: dict.meta.dataPrivacySectionTitle, desc: dict.meta.dataPrivacySectionDescription, intro: dict.meta.dataPrivacySectionIntro },
  };
  const localTitle = sectionTitles[section]?.title ?? config.title;
  const localDesc = sectionTitles[section]?.desc ?? config.description;
  const localIntro = sectionTitles[section]?.intro ?? "";

  const breadcrumbSchema = generateBreadcrumbSchema(locale, [
    { name: "Home", url: `/${locale}` },
    { name: dict.blog.insightsHeading, url: `/${locale}/insights` },
    { name: localTitle },
  ]);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className={styles.sectionBreadcrumb} aria-label="Breadcrumb">
        <Link href={`/${locale}/insights`}>{dict.blog.insightsHeading}</Link>
        <span className={styles.sectionBreadcrumbSep}>/</span>
        <span>{localTitle}</span>
      </nav>

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{localTitle}</h1>
        <p className={styles.pageDescription}>{localDesc}</p>
        {localIntro && <p className={styles.pageIntro}>{localIntro}</p>}
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
