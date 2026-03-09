import { locales, type Locale } from "@/i18n/config";

export const SITE_URL = "https://kaufast.com";

export const COMPANY = {
  name: "KAUFAST",
  legalName: "Kaufast",
  founder: "Kenneth Melchor",
  foundingDate: "2024",
  location: "Barcelona, Spain",
  url: SITE_URL,
};

export function getLocalizedUrl(locale: Locale | string, path: string = "") {
  return `${SITE_URL}/${locale}${path}`;
}

export function getAlternatesForLocale(
  locale: Locale | string,
  path: string = ""
) {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = getLocalizedUrl(loc, path);
  }
  languages["x-default"] = getLocalizedUrl("en-GB", path);

  return {
    canonical: getLocalizedUrl(locale, path),
    languages,
  };
}
