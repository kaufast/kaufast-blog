#!/usr/bin/env node
/**
 * One-time batch fix: normalises translated category/author frontmatter to English.
 * Safe to re-run — only modifies files that have matching violations.
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const CONTENT = join(ROOT, "content/blog");

// category: wrong value → correct English value
const CATEGORY_MAP = {
  // Spanish
  "Agentes de IA":                "AI Agents",
  "Agentes IA":                   "AI Agents",
  "Automatización Empresarial":   "Business Automation",
  "Automatización de Negocios":   "Business Automation",
  "SEO y Visibilidad en IA":      "SEO & AI Visibility",
  "SEO y Visibilidad IA":         "SEO & AI Visibility",
  "IA y SEO":                     "SEO & AI Visibility",
  "IA y Negocios":                "Business Automation",
  "Consultoría IT":               "IT Consulting",
  "Seguridad Femenina":           "Women Safety",
  "Liderazgo":                    "Thought Leadership",
  // German
  "KI-Agenten":                   "AI Agents",
  "Unternehmensautomatisierung":  "Business Automation",
  "IT-Beratung":                  "IT Consulting",
  "Frauensicherheit":             "Women Safety",
  // Catalan
  "SEO i Visibilitat en IA":      "SEO & AI Visibility",
  // French
  "SEO & Visibilité IA":          "SEO & AI Visibility",
  // Portuguese
  "SEO e Visibilidade em IA":     "SEO & AI Visibility",
  // Serbian
  "AI Agenti":                    "AI Agents",
  "Automatizacija Poslovanja":    "Business Automation",
  "IT Konsalting":                "IT Consulting",
  "Bezbednost Zena":              "Women Safety",
};

// Bare "SEO" category (only match exact frontmatter value)
const SEO_BARE_RE = /^(category:\s*)"SEO"$/m;

// Author fixes
const AUTHOR_MAP = {
  "Martha Nowak":   "Kenneth Melchor",
  "Equipo Kaufast": "Kenneth Melchor",
};

function collectMdx(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectMdx(full));
    else if (entry.name.endsWith(".mdx")) files.push(full);
  }
  return files;
}

const files = collectMdx(CONTENT);
let changed = 0;

for (const file of files) {
  let content = readFileSync(file, "utf-8");
  const original = content;

  // Fix categories
  for (const [wrong, correct] of Object.entries(CATEGORY_MAP)) {
    const re = new RegExp(`^(category:\\s*)"${wrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "m");
    content = content.replace(re, `$1"${correct}"`);
  }
  // Fix bare "SEO" category
  content = content.replace(SEO_BARE_RE, `$1"SEO & AI Visibility"`);

  // Fix authors
  for (const [wrong, correct] of Object.entries(AUTHOR_MAP)) {
    const re = new RegExp(`^(author:\\s*)"${wrong}"`, "m");
    content = content.replace(re, `$1"${correct}"`);
  }

  if (content !== original) {
    writeFileSync(file, content, "utf-8");
    console.log(`fixed: ${relative(ROOT, file)}`);
    changed++;
  }
}

console.log(`\n${changed} files updated.`);
