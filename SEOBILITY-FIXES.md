# Seobility Audit Fixes — kaufast-blog

> **For agentic workers:** Execute these tasks sequentially. Each task is independently committable.

**Goal:** Fix blog-side SEO issues flagged by Seobility June 15, 2026 audit. Covers meta titles, meta descriptions, bold/strong tag overuse, and 1 duplicate heading.

**Context:** The Seobility audit crawled 507 pages on kaufast.com (overall score 79%). Blog articles are proxied from this repo via Next.js rewrites. The blog layout appends " | KAUFAST" to all `<title>` tags.

---

## Task 4: Verify/Shorten Too-Long Meta Titles (11 pages)

**Rule:** The `title` frontmatter field + " | KAUFAST" suffix must fit under 580px (~55 chars for title, ~65 chars total with suffix).

**Investigation first:** The MDX `title` fields may have ALREADY been shortened in a previous fix. Check each file's current `title:` value. If it's already short (under 45 chars), skip it — Seobility was caching an older crawl.

**Files to check (read the `title:` line in each):**

| # | File Path | Seobility Reported Title (with suffix) | Pixels |
|---|-----------|---------------------------------------|--------|
| 1 | `content/blog/pt-BR/agentes-ia-para-negocios-guia-completo.mdx` | Agentes de IA para Empresas: O Guia Completo de 2026 \| KAUFAST | 622 |
| 2 | `content/blog/pt-PT/agentes-ia-para-negocios-guia-completo.mdx` | Agentes de IA para Negocios: O Guia Completo de 2026 \| KAUFAST | 615 |
| 3 | `content/blog/es-MX/automatizacion-empresarial-guia-completa.mdx` | Automatizacion Empresarial: La Guia Completa para 2026 \| KAUFAST | 630 |
| 4 | `content/blog/sr-RS/automatizacija-poslovanja-kompletan-vodic.mdx` | Automatizacija Poslovanja: Kompletan Vodic za 2026 \| KAUFAST | 583 |
| 5 | `content/blog/pt-BR/automacao-empresarial-guia-completo.mdx` | Automacao Empresarial: O Guia Completo para 2026 \| KAUFAST | 586 |
| 6 | `content/blog/pt-PT/automacao-empresarial-guia-completo.mdx` | Automatizacao de Negocios: O Guia Completo para 2026 \| KAUFAST | 622 |
| 7 | `content/blog/es-MX/seguridad-mujeres-mexico-audra.mdx` | Mexico, feminicidio y Audra: la app que puede salvar vidas \| KAUFAST | 631 |
| 8 | `content/blog/pt-BR/estrategias-seo-que-realmente-funcionam.mdx` | Estrategias de SEO Que Realmente Funcionam em 2026 \| KAUFAST | 620 |
| 9 | `content/blog/pt-PT/estrategias-seo-que-realmente-funcionam.mdx` | Estrategias de SEO que Realmente Funcionam em 2026 \| KAUFAST | 615 |
| 10 | `content/blog/pt-BR/5-formas-faceis-de-tornar-seu-negocio-mais-visivel-online.mdx` | 5 Formas de Tornar Seu Negocio Mais Visivel Online \| KAUFAST | 581 |

**Steps:**

- [ ] **Step 1:** Read the `title:` frontmatter line in each of the 10 files listed above.
- [ ] **Step 2:** For any title that, when combined with " | KAUFAST", would exceed ~55 characters for the title part, shorten it. Remove filler words like "Completo/Completa", "Realmente", "para 2026", "O Guia". Keep the core keyword phrase.
- [ ] **Step 3:** If all titles are already short (as expected from prior fixes), skip this task — document "already fixed, awaiting Seobility re-crawl".
- [ ] **Step 4:** If any were changed, commit:
```bash
git add content/blog/
git commit -m "fix(seo): shorten too-long blog meta titles for Seobility audit"
```

---

## Task 5: Shorten Too-Long Meta Descriptions (12 pages)

**Rule:** The `headline` frontmatter field serves as the meta description. Must be under 135 characters (under 1000px rendered width).

**Files to edit:**

| # | File Path | Current Pixels |
|---|-----------|---------------|
| 1 | `content/blog/ru-RU/seo-agentstvo-barselona-rukovodstvo.mdx` | 1031 |
| 2 | `content/blog/ru-RU/ot-seo-k-seo-geo-chto-izmenilos-v-2026.mdx` | 1014 |
| 3 | `content/blog/sr-RS/kako-izabrati-it-konsultanta-vodic.mdx` | 1183 |
| 4 | `content/blog/es-MX/agentes-ia-para-empresas-guia-completa.mdx` | 1177 |
| 5 | `content/blog/sr-RS/ai-agenti-za-poslovanje-kompletan-vodic.mdx` | 1061 |
| 6 | `content/blog/pt-BR/agentes-ia-para-negocios-guia-completo.mdx` | 1260 |
| 7 | `content/blog/pt-PT/agentes-ia-para-negocios-guia-completo.mdx` | 1170 |
| 8 | `content/blog/es-MX/automatizacion-empresarial-guia-completa.mdx` | 1374 |
| 9 | `content/blog/sr-RS/automatizacija-poslovanja-kompletan-vodic.mdx` | 1190 |
| 10 | `content/blog/pt-BR/automacao-empresarial-guia-completo.mdx` | 1289 |

**Steps:**

- [ ] **Step 1:** Read the `headline:` frontmatter line in each of the 10 files.
- [ ] **Step 2:** Count characters. If over 135, rewrite to be under 135 while keeping the core message. Keep the same language — do NOT translate. Just trim.

**Shortening strategy:** Cut trailing detail. Keep the "what + who + why" structure. Drop enumerations.

Example:
```yaml
# BEFORE (160 chars):
headline: "Uma guia em linguagem acessivel sobre agentes de IA para empresas — o que sao, como se diferenciam de chatbots, casos de uso reais, custos e como colocar um para funcionar dentro da sua empresa."

# AFTER (130 chars):
headline: "O que sao agentes de IA, como diferem de chatbots, casos de uso reais e como implementar na sua empresa."
```

- [ ] **Step 3:** Commit:
```bash
git add content/blog/
git commit -m "fix(seo): shorten too-long blog meta descriptions (12 pages, max 135 chars)"
```

---

## Task 6: Fix Strong/Bold Tag Overuse (91 pages)

**Rule:** Seobility flags `**bold text**` in MDX when:
- A single bold span exceeds 70 characters ("Too long")
- Too many bold tags on one page ("Many tags")
- The same text is bolded more than once ("Duplicate")

**Affected article families:**

| Article Slug Pattern | Issues | Locales to Check |
|---------------------|--------|-----------------|
| `reservierungen-restaurant-automatisieren-kompletter-leitfaden` / `automate-restaurant-reservations-complete-guide` / `automatizar-reservas-restaurante-guia-completa` / `automatitzar-reserves-restaurant-guia-completa` | Many tags + Duplicate | de-DE, en-GB, en-US, es-ES, ca-ES, de-AT |
| `von-seo-zu-seo-geo-was-sich-2026-geaendert-hat` | Many tags | de-DE |
| `unternehmensautomatisierung-kompletter-leitfaden` | Many tags + Duplicate | de-DE |
| `sicherheit-frauen-deutschland-audra` | Many tags | de-DE |
| `whatsapp-bot-for-restaurants-reservations-orders` | Many tags | en-GB |

**Steps:**

- [ ] **Step 1:** For each affected MDX file, search for `**` (bold markers). List all bold spans.

- [ ] **Step 2:** Apply these rules to each bold span:
  - **If >70 characters:** Bold only the first key phrase (2-5 words), un-bold the rest.
    ```md
    <!-- BEFORE -->
    **AI agents for restaurant reservations can reduce no-shows by up to 60% while freeing your staff**

    <!-- AFTER -->
    **AI agents for restaurant reservations** can reduce no-shows by up to 60% while freeing your staff
    ```
  - **If duplicate:** Find the same bolded phrase appearing twice. Un-bold the SECOND occurrence (keep the first).
    ```md
    <!-- First occurrence: keep bold -->
    **restaurant reservation automation**

    <!-- Second occurrence: remove bold -->
    restaurant reservation automation
    ```
  - **If "many tags":** If a page has more than ~15 bold spans, reduce to the 8-10 most important ones. Un-bold the rest.

- [ ] **Step 3:** Process ALL locales for each article family. The same article exists in multiple locales with the same bold structure. Fix all of them.

**Full file list to process (check existence first — some may not exist in all locales):**

```
content/blog/de-DE/reservierungen-restaurant-automatisieren-kompletter-leitfaden.mdx
content/blog/en-GB/automate-restaurant-reservations-complete-guide.mdx
content/blog/en-US/automate-restaurant-reservations-complete-guide.mdx
content/blog/es-ES/automatizar-reservas-restaurante-guia-completa.mdx
content/blog/ca-ES/automatitzar-reserves-restaurant-guia-completa.mdx
content/blog/de-AT/reservierungen-restaurant-automatisieren-kompletter-leitfaden.mdx
content/blog/de-DE/von-seo-zu-seo-geo-was-sich-2026-geaendert-hat.mdx
content/blog/de-DE/unternehmensautomatisierung-kompletter-leitfaden.mdx
content/blog/de-DE/sicherheit-frauen-deutschland-audra.mdx
content/blog/en-GB/whatsapp-bot-for-restaurants-reservations-orders.mdx
```

IMPORTANT: Seobility flagged 91 PAGES total. The above are the article families — each family has translations in multiple locales. Process the parent (en-GB or de-DE) first, then apply the same bold-reduction pattern to all locale variants.

- [ ] **Step 4:** Commit:
```bash
git add content/blog/
git commit -m "fix(seo): reduce bold/strong tag overuse in 91 blog pages (max 70 chars per span)"
```

---

## Task 7: Fix Duplicate Heading (1 page)

**File:** `content/blog/en-GB/5-business-processes-every-smb-should-automate.mdx`

**Issue:** Seobility detected a "Duplicate heading" — the same heading text appears twice in the article.

**Steps:**

- [ ] **Step 1:** Open the file and search for all `##` and `###` headings. Find the two that have identical text.
- [ ] **Step 2:** Rename the second occurrence to be more specific. For example:
  ```md
  ## Customer Onboarding     ← first occurrence (keep)
  ## Advanced Customer Onboarding  ← second occurrence (differentiate)
  ```
- [ ] **Step 3:** Commit:
```bash
git add content/blog/en-GB/5-business-processes-every-smb-should-automate.mdx
git commit -m "fix(seo): deduplicate heading in 5-business-processes article"
```

---

## Execution Order

1. Task 4 (verify titles) — likely already done, quick check
2. Task 5 (shorten descriptions) — 12 files, straightforward
3. Task 7 (duplicate heading) — 1 file, trivial
4. Task 6 (bold/strong overuse) — 91 pages, biggest effort

## After All Tasks

Run the blog build to verify no MDX parsing errors:
```bash
npm run build
```

Then deploy and request a Seobility re-crawl.
