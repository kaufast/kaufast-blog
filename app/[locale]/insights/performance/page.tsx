import type { Metadata } from "next";
import { locales } from "@/i18n/config";
import { getAlternatesForLocale } from "@/lib/seo";
import InsightsSectionPage from "../InsightsSectionPage";

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
  return {
    title: "Web Performance",
    description:
      "Site speed, Core Web Vitals, and performance optimisations that boost rankings and revenue.",
    alternates: getAlternatesForLocale(locale, "/insights/performance"),
  };
}

export default async function PerformanceSectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  return <InsightsSectionPage locale={locale} section="performance" />;
}
