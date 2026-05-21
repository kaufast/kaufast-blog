import { SITE_URL, COMPANY, getLocalizedUrl } from "./seo";
import type { PostFrontmatter } from "./blog";

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    url: COMPANY.url,
    foundingDate: COMPANY.foundingDate,
    founder: {
      "@type": "Person",
      name: COMPANY.founder,
    },
    location: {
      "@type": "Place",
      address: COMPANY.location,
    },
  };
}

export function generateArticleSchema(
  locale: string,
  post: PostFrontmatter & { slug: string }
) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": post.schemaType || "Article",
    headline: post.title,
    description: post.headline,
    datePublished: post.date,
    dateModified: post.lastmod || post.date,
    author: {
      "@type": "Person",
      name: post.author,
      url: `${SITE_URL}/en-GB/kenneth-melchor`,
      jobTitle: "Founder",
      worksFor: {
        "@type": "Organization",
        name: COMPANY.name,
        url: COMPANY.url,
      },
      sameAs: [
        `${SITE_URL}/en-GB/kenneth-melchor`,
      ],
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

  if (post.about?.length) {
    schema.about = post.about.map((name) => ({
      "@type": "Thing",
      name,
    }));
  }

  if (post.dependencies) {
    schema.dependencies = post.dependencies;
  }

  return schema;
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

export function generateFAQSchema(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
