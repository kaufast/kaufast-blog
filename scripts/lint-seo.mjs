#!/usr/bin/env node
/**
 * SEO lint for MDX blog articles.
 *
 * Catches every recurring Seobility violation BEFORE commit:
 *   1. Bold spans >70 chars
 *   2. headline (meta description) >155 chars  (>145 for DE/FR)
 *   3. title + " — KAUFAST" has a word repeated >2×
 *   4. title <20 chars
 *   5. Internal /insights/ links pointing to non-existent slugs
 *   6. author field translated (must be "Kenneth Melchor")
 *   7. category field not in English
 *   8. Slug missing from slug-map.json
 *
 * Usage:
 *   node scripts/lint-seo.mjs                     # lint all MDX files
 *   node scripts/lint-seo.mjs content/blog/en-GB/  # lint one directory
 *   node scripts/lint-seo.mjs --staged             # lint git-staged MDX files only
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, relative, basename } from "path";
import { execFileSync } from "child_process";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const CONTENT = join(ROOT, "content/blog");
const SLUG_MAP_PATH = join(CONTENT, "slug-map.json");

const VALID_CATEGORIES = [
  "SEO & AI Visibility",
  "Business Automation",
  "Data Privacy & Compliance",
  "Marketing Digital",
  "AI Agents",
  "Performance",
  "Women Safety",
  "Thought Leadership",
  "IT Consulting",
  "Case Study",
];

const WIDE_LOCALES = new Set(["de-DE", "de-AT", "fr-FR"]);
const HEADLINE_MAX = 155;
const HEADLINE_MAX_WIDE = 145;
const BOLD_MAX = 70;
const TITLE_MIN = 20;
const TITLE_SUFFIX = " — KAUFAST";

// ── Collect files ──────────────────────────────────────────────────────

function collectMdx(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectMdx(full));
    else if (entry.name.endsWith(".mdx")) files.push(full);
  }
  return files;
}

function getStagedMdx() {
  const out = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACM"],
    { cwd: ROOT, encoding: "utf-8" }
  );
  return out
    .split("\n")
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => join(ROOT, f));
}

// ── Parse frontmatter ──────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return fm;
}

// ── Checks ─────────────────────────────────────────────────────────────

function checkBold(content, errors) {
  const body = content.replace(/^---\n[\s\S]*?\n---/, "");
  const re = /\*\*([^*]+?)\*\*/g;
  let m;
  let lineNum = content.indexOf(body) > 0
    ? content.slice(0, content.indexOf(body)).split("\n").length
    : 1;

  for (const line of body.split("\n")) {
    re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      if (m[1].length > BOLD_MAX) {
        errors.push(
          `BOLD >70 chars (${m[1].length}): line ${lineNum} — "${m[1].slice(0, 60)}…"`
        );
      }
    }
    lineNum++;
  }
}

function checkHeadline(fm, locale, errors) {
  if (!fm.headline) return;
  const max = WIDE_LOCALES.has(locale) ? HEADLINE_MAX_WIDE : HEADLINE_MAX;
  if (fm.headline.length > max) {
    errors.push(
      `HEADLINE too long: ${fm.headline.length} chars (max ${max} for ${locale}) — "${fm.headline.slice(0, 60)}…"`
    );
  }
}

function checkTitleRepetition(fm, errors) {
  if (!fm.title) return;
  const full = fm.title + TITLE_SUFFIX;
  const words = full.toLowerCase().match(/[a-záàâãäéèêëíìîïóòôõöúùûüñçšžćčðæøþ]+/g) || [];
  const counts = {};
  for (const w of words) {
    if (w.length <= 2) continue; // skip articles/prepositions (a, as, de, o, e, etc.)
    counts[w] = (counts[w] || 0) + 1;
    if (counts[w] > 2) {
      errors.push(`TITLE word repeated >2×: "${w}" appears ${counts[w]}× in "${full}"`);
    }
  }
}

function checkTitleLength(fm, errors) {
  if (!fm.title) return;
  if (fm.title.length < TITLE_MIN) {
    errors.push(`TITLE too short: ${fm.title.length} chars (min ${TITLE_MIN}) — "${fm.title}"`);
  }
}

function checkAuthor(fm, errors) {
  if (fm.author && fm.author !== "Kenneth Melchor") {
    errors.push(`AUTHOR must be "Kenneth Melchor", got "${fm.author}"`);
  }
}

function checkCategory(fm, errors) {
  if (fm.category && !VALID_CATEGORIES.includes(fm.category)) {
    errors.push(
      `CATEGORY must be English. Got "${fm.category}". Valid: ${VALID_CATEGORIES.join(", ")}`
    );
  }
}

function checkInternalLinks(content, locale, errors) {
  const re = /\[([^\]]*)\]\(\/insights\/([^)]+)\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const slug = m[2];
    const localeDir = join(CONTENT, locale);
    if (!existsSync(join(localeDir, `${slug}.mdx`))) {
      errors.push(`BROKEN LINK: /insights/${slug} does not exist in ${locale}/`);
    }
  }
}

function checkSlugMap(locale, fileName, slugMap, errors) {
  const slug = basename(fileName, ".mdx");

  let found = false;
  for (const [, mapping] of Object.entries(slugMap)) {
    if (mapping[locale] === slug) {
      found = true;
      break;
    }
  }
  if (!found) {
    errors.push(`SLUG-MAP: "${slug}" not found in slug-map.json for locale ${locale}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const staged = args.includes("--staged");
const targetDir = args.find((a) => !a.startsWith("-"));

let files;
if (staged) {
  files = getStagedMdx();
  if (files.length === 0) {
    console.log("No staged MDX files to lint.");
    process.exit(0);
  }
} else if (targetDir) {
  const abs = targetDir.startsWith("/") ? targetDir : join(ROOT, targetDir);
  // Accept a single .mdx file or a directory
  files = abs.endsWith(".mdx") ? [abs] : collectMdx(abs);
} else {
  files = collectMdx(CONTENT);
}

let slugMap = {};
if (existsSync(SLUG_MAP_PATH)) {
  slugMap = JSON.parse(readFileSync(SLUG_MAP_PATH, "utf-8"));
}

let totalErrors = 0;
let filesWithErrors = 0;

for (const file of files) {
  const rel = relative(ROOT, file);
  const content = readFileSync(file, "utf-8");
  const fm = parseFrontmatter(content);

  // Derive locale from path: content/blog/{locale}/slug.mdx
  const parts = rel.split("/");
  const localeIdx = parts.indexOf("blog") + 1;
  const locale = parts[localeIdx] || "en-GB";

  const errors = [];

  checkBold(content, errors);
  checkHeadline(fm, locale, errors);
  checkTitleRepetition(fm, errors);
  checkTitleLength(fm, errors);
  checkAuthor(fm, errors);
  checkCategory(fm, errors);
  checkInternalLinks(content, locale, errors);
  checkSlugMap(locale, file, slugMap, errors);

  if (errors.length > 0) {
    filesWithErrors++;
    totalErrors += errors.length;
    console.log(`\n\x1b[31m✗\x1b[0m ${rel}`);
    for (const e of errors) {
      console.log(`  \x1b[33m⚠\x1b[0m ${e}`);
    }
  }
}

console.log(
  `\n${files.length} files checked. ${totalErrors} errors in ${filesWithErrors} files.`
);

if (totalErrors > 0) {
  console.log("\x1b[31mSEO lint failed.\x1b[0m Fix the errors above before committing.");
  process.exit(1);
}

console.log("\x1b[32mSEO lint passed.\x1b[0m");
