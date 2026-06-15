import { locales, getDictionary } from "@/i18n/config";
import { BlogHeader } from "@/components/BlogHeader";
import { BlogFooter } from "@/components/BlogFooter";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <html lang={locale}>
      <body>
        <BlogHeader locale={locale} />
        {children}
        <BlogFooter locale={locale} dict={dict} />
      </body>
    </html>
  );
}
