import type { Metadata } from "next";
import { locales, getDictionary } from "@/i18n/config";
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
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.dataPrivacySectionTitle,
    description: dict.meta.dataPrivacySectionDescription,
    alternates: getAlternatesForLocale(locale, "/insights/data-privacy"),
  };
}

export default async function DataPrivacySectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  return <InsightsSectionPage locale={locale} section="data-privacy" />;
}
