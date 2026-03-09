import { SITE_URL, COMPANY, getLocalizedUrl } from "./seo";
import type { PostFrontmatter } from "./blog";

export function generateArticleSchema(
  locale: string,
  post: PostFrontmatter & { slug: string }
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.headline,
    datePublished: post.date,
    dateModified: post.lastmod || post.date,
    author: {
      "@type": "Person",
      name: post.author,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: COMPANY.name,
      url: COMPANY.url,
    },
    image: post.image ? `${SITE_URL}${post.image}` : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": getLocalizedUrl(locale, `/insights/${post.slug}`),
    },
  };
}

export function generateBreadcrumbSchema(
  locale: string,
  items: { name: string; url?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined,
    })),
  };
}
