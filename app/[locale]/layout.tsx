import { locales } from "@/i18n/config";
import { BlogHeader } from "@/components/BlogHeader";
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

  return (
    <html lang={locale}>
      <body>
        <BlogHeader locale={locale} />
        {children}
      </body>
    </html>
  );
}
