/**
 * One-time migration script: converts KaufastSEO blogs.json → MDX files
 * Run: node scripts/migrate-blog.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Source data
const SOURCE_JSON = "/Users/melchor/WebDev/KaufastSEO/public/locales/en-GB/blogs.json";
const ES_JSON = "/Users/melchor/WebDev/KaufastSEO/public/locales/es-ES/blogs.json";

// Tags and featured from blogs.js (not in JSON)
const blogMeta = {
  blog5:  { tags: ["Local SEO", "Google Business Profile", "Reviews", "AI Visibility"], featured: false, image: "/images/blog/local-seo-google-business-profile-map.webp" },
  blog7:  { tags: ["Site Speed", "Core Web Vitals", "SEO", "Performance"], featured: false, image: "/images/blog/site-speed-core-web-vitals-metrics.webp" },
  blog8:  { tags: ["Conversions", "SEO", "Landing Pages", "CRO"], featured: false, image: "/images/blog/cro-ab-test-cta-button-variations.webp" },
  blog9:  { tags: ["SEO Analytics", "GA4", "Search Console", "KPIs"], featured: false, image: "/images/blog/seo-team-performance-optimization-tablet.webp" },
  blog12: { tags: ["SEO", "PPC", "Paid Ads", "SMB"], featured: false, image: "/images/blog/seo-vs-ads-traffic-comparison-pie.webp" },
  blog17: { tags: ["Programmatic SEO", "Automation", "Scalable Content", "Technical SEO"], featured: false, image: "/images/blog/cro-search-intent-funnel-informational-commercial-transactional.webp" },
  blog20: { tags: ["SEO", "Content Strategy", "E-E-A-T", "AI Visibility"], featured: false, image: "/images/blog/pinterest-organic-growth-search-mockup.webp" },
  blog21: { tags: ["Search Engines", "Crawling", "Indexing", "SEO Basics"], featured: false, image: "/images/blog/duckduckgo-instant-answers-schema.webp" },
  blog22: { tags: ["AI Search", "ChatGPT", "Business Discovery", "AI Visibility"], featured: false, image: "/images/blog/perplexity-search-citation-sources.webp" },
  blog23: { tags: ["Online Visibility", "Google Business", "Reviews", "Local SEO"], featured: false, image: "/images/blog/local-seo-customer-reviews-stars.webp" },
  blog24: { tags: ["AI Ready", "Business Strategy", "AI Visibility", "Digital Presence"], featured: false, image: "/images/blog/bing-webmaster-tools-dashboard.webp" },
  blog25: { tags: ["WhatsApp", "AI Agents", "Business Bots", "Customer Service"], featured: true, image: "/images/blog/pinterest-ads-professional-recruitment.webp" },
  blog26: { tags: ["SEO", "GEO", "AI Visibility", "Structured Data", "Bing", "Schema.org"], featured: false, image: "/images/blog/pinterest-seo-strategy-mobile-dashboard.webp" },
  blog27: { tags: ["WhatsApp", "Restaurants", "Reservations", "No-shows"], featured: false, image: "/images/blog/local-seo-apple-maps-business-connect.webp" },
  blog28: { tags: ["Founders", "Web Development", "20 Years", "Barcelona"], featured: false, image: "/images/blog/seo-vs-ads-budget-split-timeline.webp" },
  blog29: { tags: ["Clinics", "Healthcare", "AI Receptionist", "No-shows"], featured: false, image: "/images/blog/site-speed-mobile-vs-desktop-comparison.webp" },
  blog30: { tags: ["Real Estate", "WhatsApp", "Lead Qualification"], featured: false, image: "/images/blog/seo-vs-ads-cost-per-visitor-timeline.webp" },
  blog31: { tags: ["ChatGPT", "AI Visibility", "GEO", "Bing"], featured: false, image: "/images/blog/cro-landing-page-trust-signals-wireframe.webp" },
  blog32: { tags: ["Automation", "SMB", "Business Processes", "Efficiency"], featured: false, image: "/images/blog/site-speed-pagespeed-insights-score.webp" },
  blog33: { tags: ["Bing", "DuckDuckGo", "Perplexity", "Claude", "AI Visibility", "SEO"], featured: true, image: "/images/blog/beyond-google-bing-duckduckgo-perplexity-claude-hero.webp" },
};

function convertContentToMdx(contentArray) {
  const parts = [];

  for (const block of contentArray) {
    // Handle [img] tags → markdown images
    if (block.startsWith("[img]")) {
      const match = block.match(/\[img\](.+?)\|(.+)/);
      if (match) {
        const src = match[1].replace("/assets/img/blog/", "/images/blog/");
        const alt = match[2];
        parts.push(`![${alt}](${src})`);
      }
      continue;
    }

    // Process block: convert **Bold heading**\nParagraph to ## heading + paragraph
    let text = block;

    // Convert bold-line-as-heading pattern: **Heading Text**\nContent
    // Only when **...** is at the start of a line and followed by \n
    text = text.replace(/^\*\*(.+?)\*\*\n/gm, (match, heading) => {
      return `## ${heading}\n\n`;
    });

    // Also handle **Heading Text** that starts a block (beginning of string)
    // but only if it's a standalone heading line pattern
    // (already handled by the regex above with ^ and m flag)

    parts.push(text);
  }

  return parts.join("\n\n");
}

function buildFrontmatter(blogId, entry, meta) {
  const fm = {
    title: entry.title,
    headline: entry.headline,
    date: entry.date,
    lastmod: entry.lastmod || entry.date,
    author: entry.author,
    category: entry.category,
    tags: meta.tags,
    image: meta.image,
    featured: meta.featured,
  };

  // Build YAML manually to avoid dependency
  let yaml = "---\n";
  yaml += `title: ${JSON.stringify(fm.title)}\n`;
  yaml += `headline: ${JSON.stringify(fm.headline)}\n`;
  yaml += `date: ${JSON.stringify(fm.date)}\n`;
  yaml += `lastmod: ${JSON.stringify(fm.lastmod)}\n`;
  yaml += `author: ${JSON.stringify(fm.author)}\n`;
  yaml += `category: ${JSON.stringify(fm.category)}\n`;
  yaml += `tags:\n`;
  for (const tag of fm.tags) {
    yaml += `  - ${JSON.stringify(tag)}\n`;
  }
  yaml += `image: ${JSON.stringify(fm.image)}\n`;
  yaml += `featured: ${fm.featured}\n`;
  yaml += "---\n";

  return yaml;
}

function migrateLocale(localeJsonPath, locale) {
  const raw = fs.readFileSync(localeJsonPath, "utf-8");
  const data = JSON.parse(raw);
  const blogs = data.blogs;

  const outDir = path.join(projectRoot, "content", "blog", locale);
  fs.mkdirSync(outDir, { recursive: true });

  let count = 0;

  for (const [blogId, entry] of Object.entries(blogs)) {
    const meta = blogMeta[blogId];
    if (!meta) {
      console.warn(`  Skipping ${blogId} — no meta found`);
      continue;
    }

    const slug = entry.slug;
    const frontmatter = buildFrontmatter(blogId, entry, meta);
    const mdxContent = convertContentToMdx(entry.content);
    const fullContent = frontmatter + "\n" + mdxContent + "\n";

    const outPath = path.join(outDir, `${slug}.mdx`);
    fs.writeFileSync(outPath, fullContent, "utf-8");
    count++;
    console.log(`  ✓ ${locale}/${slug}.mdx`);
  }

  return count;
}

// Main
console.log("=== Kaufast Blog Migration ===\n");

console.log("Migrating en-GB...");
const enCount = migrateLocale(SOURCE_JSON, "en-GB");
console.log(`  → ${enCount} posts\n`);

console.log("Migrating es-ES...");
const esCount = migrateLocale(ES_JSON, "es-ES");
console.log(`  → ${esCount} posts\n`);

console.log(`Done! ${enCount + esCount} total MDX files created.`);
