/**
 * Translate blog articles from en-GB to target locales using Claude Haiku.
 *
 * Usage:
 *   npx tsx scripts/translate-articles-haiku.ts                    # all 3 target locales
 *   npx tsx scripts/translate-articles-haiku.ts --locale fr-FR     # single locale
 *   npx tsx scripts/translate-articles-haiku.ts --dry-run          # preview without writing
 *   npx tsx scripts/translate-articles-haiku.ts --skip-existing    # skip already-translated articles
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Load .env if present (for ANTHROPIC_API_KEY)
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

const client = new Anthropic();

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SLUG_MAP_PATH = path.join(BLOG_DIR, "slug-map.json");

const TARGET_LOCALES: Record<string, { language: string; region: string }> = {
  "fr-FR": { language: "French", region: "France" },
  "pt-BR": { language: "Portuguese", region: "Brazil" },
  "de-DE": { language: "German", region: "Germany" },
};

interface TranslationResult {
  slug: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

async function translateArticle(
  enSlug: string,
  rawContent: string,
  locale: string,
  language: string,
  region: string,
): Promise<TranslationResult> {
  const { data: frontmatter, content } = matter(rawContent);

  // Build the translation prompt
  const prompt = `Translate this blog article from English to ${language} (${region}).

RULES:
1. Translate the frontmatter fields: title, headline, category, tags, faq questions/answers, h1 (if present)
2. DO NOT translate: author, image, date, lastmod, featured, audra, echoflicks, schemaType, about, dependencies
3. Translate the markdown body content completely
4. Keep all markdown formatting (##, **, [], (), ![]) intact
5. Keep image paths and URLs unchanged
6. Keep brand names unchanged: KAUFAST, ChatGPT, Google, Bing, WhatsApp, etc.
7. Use natural ${language} (${region}) — not machine-translated style
8. Keep technical terms that are commonly used in English in ${region} (e.g., SEO, API, CRM)
9. Generate a URL-friendly slug in ${language}: lowercase, hyphens, no accents, max 60 chars

Return your response in this EXACT format — no extra text before or after:

SLUG: <translated-slug>

---FRONTMATTER---
${Object.entries(frontmatter)
  .filter(([k]) => ["title", "headline", "category", "tags", "h1"].includes(k))
  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  .join("\n")}
---END FRONTMATTER---

---CONTENT---
<translated markdown content>
---END CONTENT---

${frontmatter.faq ? `---FAQ---\n${JSON.stringify(frontmatter.faq, null, 2)}\n---END FAQ---` : ""}

SOURCE ARTICLE:

---
${Object.entries(frontmatter).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")}
---

${content}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const response = message.content[0].type === "text" ? message.content[0].text : "";

  // Parse response
  const slugMatch = response.match(/SLUG:\s*(.+)/);
  const slug = slugMatch
    ? slugMatch[1].trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60)
    : enSlug;

  // Parse frontmatter fields
  const fmMatch = response.match(/---FRONTMATTER---\n([\s\S]*?)---END FRONTMATTER---/);
  const translatedFM: Record<string, unknown> = { ...frontmatter };
  if (fmMatch) {
    for (const line of fmMatch[1].trim().split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      try {
        translatedFM[key] = JSON.parse(val);
      } catch {
        translatedFM[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }

  // Parse FAQ
  const faqMatch = response.match(/---FAQ---\n([\s\S]*?)---END FAQ---/);
  if (faqMatch) {
    try {
      translatedFM.faq = JSON.parse(faqMatch[1].trim());
    } catch { /* keep original */ }
  }

  // Parse content
  const contentMatch = response.match(/---CONTENT---\n([\s\S]*?)---END CONTENT---/);
  const translatedContent = contentMatch ? contentMatch[1].trim() : content;

  return { slug, frontmatter: translatedFM, content: translatedContent };
}

function buildMdx(frontmatter: Record<string, unknown>, content: string): string {
  return matter.stringify(content, frontmatter);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipExisting = args.includes("--skip-existing");
  const localeFlag = args.indexOf("--locale");
  const targetLocales = localeFlag !== -1 && args[localeFlag + 1]
    ? { [args[localeFlag + 1]]: TARGET_LOCALES[args[localeFlag + 1]] }
    : TARGET_LOCALES;

  // Validate locales
  for (const locale of Object.keys(targetLocales)) {
    if (!TARGET_LOCALES[locale]) {
      console.error(`Unknown locale: ${locale}. Available: ${Object.keys(TARGET_LOCALES).join(", ")}`);
      process.exit(1);
    }
  }

  // Read slug map
  const slugMap: Record<string, Record<string, string>> = JSON.parse(
    fs.readFileSync(SLUG_MAP_PATH, "utf-8"),
  );

  // Read all en-GB articles
  const enDir = path.join(BLOG_DIR, "en-GB");
  const articles = fs.readdirSync(enDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));

  console.log(`Source: ${articles.length} en-GB articles`);
  console.log(`Target locales: ${Object.keys(targetLocales).join(", ")}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [locale, { language, region }] of Object.entries(targetLocales)) {
    const localeDir = path.join(BLOG_DIR, locale);
    if (!fs.existsSync(localeDir)) fs.mkdirSync(localeDir, { recursive: true });

    console.log(`\n=== ${locale} (${language}) ===`);

    for (const enSlug of articles) {
      // Check if already translated
      if (skipExisting && slugMap[enSlug]?.[locale]) {
        const existingSlug = slugMap[enSlug][locale];
        const existingFile = path.join(localeDir, `${existingSlug}.mdx`);
        if (fs.existsSync(existingFile)) {
          skipped++;
          continue;
        }
      }

      const enFile = path.join(enDir, `${enSlug}.mdx`);
      const rawContent = fs.readFileSync(enFile, "utf-8");

      console.log(`  Translating: ${enSlug}...`);

      try {
        const result = await translateArticle(enSlug, rawContent, locale, language, region);

        if (dryRun) {
          console.log(`    → slug: ${result.slug}`);
          console.log(`    → title: ${result.frontmatter.title}`);
          translated++;
          continue;
        }

        // Write translated file
        const outPath = path.join(localeDir, `${result.slug}.mdx`);
        fs.writeFileSync(outPath, buildMdx(result.frontmatter, result.content));

        // Update slug map
        if (!slugMap[enSlug]) slugMap[enSlug] = { "en-GB": enSlug };
        slugMap[enSlug][locale] = result.slug;

        console.log(`    ✓ ${result.slug}.mdx`);
        translated++;

        // Rate limit: 500ms between requests
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`    ✗ Failed: ${(err as Error).message}`);
        failed++;
      }
    }
  }

  // Write updated slug map
  if (!dryRun) {
    fs.writeFileSync(SLUG_MAP_PATH, JSON.stringify(slugMap, null, 2) + "\n");
    console.log(`\nUpdated slug-map.json`);
  }

  console.log(`\n--- Summary ---`);
  console.log(`Translated: ${translated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total articles × locales: ${articles.length * Object.keys(targetLocales).length}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
