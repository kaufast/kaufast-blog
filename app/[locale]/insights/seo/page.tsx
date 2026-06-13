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
    title: "SEO & Digital Growth",
    description:
      "AI visibility, search strategy, and tactics to grow organic traffic and convert more visitors.",
    alternates: getAlternatesForLocale(locale, "/insights/seo"),
  };
}

export default async function SeoSectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  return <InsightsSectionPage locale={locale} section="seo" />;
}
