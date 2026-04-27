import { redirect } from "next/navigation";
import { locales } from "@/i18n/config";

type Params = { locale: string };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/insights`);
}
