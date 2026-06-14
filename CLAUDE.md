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

### 6. Bold/strong text quality check before committing
Run this mental checklist on every MDX file in every locale before committing:
```
- [ ] No **bold** block exceeds 70 characters
- [ ] headline is 120-155 chars (130-145 for DE/FR)
- [ ] title + " — KAUFAST" has no word appearing >2 times
- [ ] All internal /insights/ links point to existing slugs in this locale
- [ ] H1 (title or h1 field) >= 20 characters
```
