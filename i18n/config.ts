export const locales = [
  "en-GB",
  "es-ES",
  "en-US",
  "es-MX",
  "ca-ES",
  "sr-RS",
  "de-AT",
  "de-DE",
  "it-IT",
  "fr-FR",
  "pt-BR",
  "pt-PT",
  "ru-RU",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en-GB";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export type Dictionary = {
  meta: {
    insightsTitle: string;
    insightsDescription: string;
  };
  blog: {
    featured: string;
    latest: string;
    readMore: string;
    minRead: string;
    backToInsights: string;
    prev: string;
    next: string;
    by: string;
    updated: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
    tableOfContents: string;
  };
};

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  "en-GB": () => import("./dictionaries/en-GB.json").then((m) => m.default),
  "es-ES": () => import("./dictionaries/es-ES.json").then((m) => m.default),
  "en-US": () => import("./dictionaries/en-US.json").then((m) => m.default),
  "es-MX": () => import("./dictionaries/es-MX.json").then((m) => m.default),
  "ca-ES": () => import("./dictionaries/ca-ES.json").then((m) => m.default),
  "sr-RS": () => import("./dictionaries/sr-RS.json").then((m) => m.default),
  "de-AT": () => import("./dictionaries/de-AT.json").then((m) => m.default),
  "de-DE": () => import("./dictionaries/de-DE.json").then((m) => m.default),
  "it-IT": () => import("./dictionaries/it-IT.json").then((m) => m.default),
  "fr-FR": () => import("./dictionaries/fr-FR.json").then((m) => m.default),
  "pt-BR": () => import("./dictionaries/pt-BR.json").then((m) => m.default),
  "pt-PT": () => import("./dictionaries/pt-PT.json").then((m) => m.default),
  "ru-RU": () => import("./dictionaries/ru-RU.json").then((m) => m.default),
};

export async function getDictionary(locale: string): Promise<Dictionary> {
  const loader = dictionaries[locale] || dictionaries[defaultLocale];
  return loader();
}
