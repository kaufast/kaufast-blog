import { NextRequest, NextResponse } from "next/server";

const locales = [
  "en-GB",
  "es-ES",
  "en-US",
  "es-MX",
  "sr-RS",
  "de-AT",
  "de-DE",
  "it-IT",
  "fr-FR",
  "pt-BR",
  "pt-PT",
  "ru-RU",
];

const defaultLocale = "en-GB";

function getLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    return segments[0];
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-page requests
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const locale = getLocaleFromPath(pathname);

  // If no locale in path, redirect to default
  if (!locale) {
    // Redirect /insights → /en-GB/insights
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and API
    "/((?!_next/static|_next/image|favicon.ico|images|api).*)",
  ],
};
