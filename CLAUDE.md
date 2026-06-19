# KAUFAST Blog — Project Rules

## Seobility Compliance (apply to EVERY article, EVERY locale)

These rules prevent recurring audit regressions. Apply them automatically whenever creating or editing blog articles — do not skip any.

### 1. Bold text: max 70 characters
- No `**...**` or `<strong>` block may exceed 70 characters
- Bold only the key phrase, not the entire sentence
- German and French translations are especially prone to exceeding this limit

### 2. Meta title: no word repeated >2 times
- Count all words in `title` + " — KAUFAST" (the suffix is appended automatically)
- No single word may appear more than twice
- Check every locale independently

### 3. Meta description (headline): pixel-width safe
- `headline` frontmatter: 120–155 chars max
- German/French: aim for 130–145 chars (longer words = more pixels)
- Avoid many uppercase/wide characters (W, M) in headlines

### 4. Internal links: no cross-locale leaks
- Every `[text](/insights/slug)` link in MDX must point to a slug that exists in THAT locale's `content/blog/{locale}/` directory
- Never hardcode a link to another locale's slug — this creates 404s
- Use slug-map.json to find the correct translated slug if needed

### 5. H1 heading: minimum 20 characters
- The `title` or `h1` frontmatter field must be at least 20 characters

### 6. Homepage insight cards (kaufast-next)
- The kaufast-next homepage (`page.tsx` line ~197) renders 4 insight cards linking to blog articles
- Each locale dictionary (`kaufast-next/i18n/dictionaries/*.json`) has `insightCards` with slugs
- **Only set a slug if the article exists natively in that locale** — check `content/blog/{locale}/` directory
- If the article doesn't exist in that locale, set the slug to `""` (empty string) — the template has a ternary that falls back to `/insights` index
- When publishing a new article with translations, update the insight card slugs in ALL 13 kaufast-next dictionaries for any cards referencing that article

### 7. Translations: Russian author field
- Always use `author: "Kenneth Melchor"` (English) — never translate to Cyrillic or other scripts
- The author field is a technical identifier used in JSON-LD schema, not display-only text

### 8. Translations: category field stays English
- `category` is used as an internal key in `getPostsBySection()` filtering logic
- Always keep categories in English: "SEO & AI Visibility", "Business Automation", "Data Privacy & Compliance", "Marketing Digital"
- Never translate category values — the section filter depends on exact English string matches

### 9. Pre-commit compliance script
Run this checklist on EVERY MDX file in EVERY locale before committing:
```
- [ ] No **bold** block exceeds 70 characters
- [ ] headline is 120-155 chars (130-145 for DE/FR)
- [ ] title + " — KAUFAST" has no word appearing >2 times
- [ ] All internal /insights/ links point to existing slugs in this locale
- [ ] H1 (title or h1 field) >= 20 characters
- [ ] author field is "Kenneth Melchor" (not translated)
- [ ] category field is in English
- [ ] slug-map.json updated with all locale entries
- [ ] If article is referenced in kaufast-next homepage cards, update insightCards slugs
```

### 10. Common translation errors to catch
These recur across Gemini translations — always check for them:
- **German (de-DE/de-AT)**: English words leaking through (e.g. "What" instead of "Was"), bold blocks too long
- **Catalan (ca-ES)**: Encoding artifacts (e.g. Japanese characters appended to words)
- **Italian (it-IT)**: Image path typos (double letters like `barcellona` in filenames), truncated output
- **Russian (ru-RU)**: Translated author name, translated category name, bold blocks too long (Cyrillic is verbose)
- **All locales**: Headlines >155 chars (translations expand ~20-40% from English), truncated articles (Gemini cuts off long outputs)
- **es-ES/es-MX**: Missing accents (rapido→rápido, minimo→mínimo, linea→línea, continuan→continúan, ahi→ahí, alla→allá, dias→días, dia→día, via→vía)
- **pt-PT/pt-BR**: Missing accents (nivel→nível, periodos→períodos, construida→construída, industrias→indústrias, tecnica→técnica, logica→lógica, comecar→começar)
- **de-DE/de-AT**: fuer→für, grosse→große — ALWAYS use proper German characters
- **fr-FR**: acces→accès, roles→rôles, resultats→résultats, categories→catégories

### 11. Title pixel-width limits (Seobility 580px max)
The browser renders titles as: `{title} | KAUFAST`. Pixel width varies by character set.
- EN: title max **50 chars**
- ES/CA/FR/IT/PT: title max **45 chars** (longer words = more pixels)
- DE (de-DE/de-AT): title max **42 chars** (umlauts and compound words are wide)
- SR (sr-RS): title max **43 chars**
- RU (ru-RU): title max **35 chars** (Cyrillic is ~20% wider per char)
- Check: count `len(title) + len(" | KAUFAST")` — must be under the per-locale char limit

### 12. Meta description pixel-width limits (Seobility 1000px max)
The `headline` field is used as the meta description. Pixel-safe limits:
- EN: **155 chars** max
- ES/CA/FR/IT/PT: **145 chars** max
- DE (de-DE/de-AT): **140 chars** max
- SR (sr-RS): **140 chars** max
- RU (ru-RU): **82 chars** max (Cyrillic chars are ~12px wide)

### 13. Keyword competition — never write articles competing with service pages
- Do NOT write data-privacy insights articles — `/privacy-policy` page owns that keyword
- WhatsApp bot articles MUST target long-tail terms (restaurant, retail, clinic), NOT the root "WhatsApp bots" keyword
- Before writing about any service topic, check if a service page already targets that root keyword

### 14. Article must have enough internal links (≥3 per article)
- Each article must link to at least 3 other internal pages (`/insights/...` or `/services/...`)
- Use descriptive anchor text max 80 chars — never use full article title as anchor text
- Check cross-locale links: only link to slugs that exist in THIS locale's directory

### Updated pre-commit checklist (add to rule 9)
```
- [ ] title + " | KAUFAST" within per-locale char limit (rule 11)
- [ ] headline within per-locale char limit (rule 12)
- [ ] No missing accents for locale (rule 10 extended)
- [ ] No cross-service-page keyword competition (rule 13)
- [ ] At least 3 internal links with short anchor text (rule 14)
```
