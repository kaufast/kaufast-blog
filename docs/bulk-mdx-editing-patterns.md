# Bulk MDX Editing Patterns — Reference

Patterns, bugs, and safe implementations for bulk-editing blog MDX files across 13 locales.
Apply these before writing any script that modifies MDX content.

---

## MDX File Structure

Every article has this structure:

```
---                          ← frontmatter start (always at char 0)
title: "..."
...
---                          ← frontmatter end (FIRST \n---\n in file)

Body paragraph...

Body paragraph...

---                          ← body section separator (SECOND \n---\n, optional)

Related reading:
- [link](/locale/insights/slug)
```

**Critical:** `\n---\n` appears at minimum once (frontmatter end). It may appear a second time before a "Related reading" section. Some locales, especially `ca-ES`, may have only 1 separator if the article is a shorter translation without a related reading block.

---

## Bug 1 — YAML Corruption via `rfind('\n---\n')`

### What went wrong
Using `content.rfind('\n---\n')` to find the insertion point before "Related reading" — when `ca-ES` articles had **only 1 `\n---\n`** (the frontmatter end), `rfind` returned the frontmatter separator. The script then inserted text **inside the YAML frontmatter**, producing:

```
YAMLException: can not read an implicit mapping pair; a colon is missed at line 31
```

### Symptom
`npx next build` fails with `Error: Failed to collect page data for /[locale]/insights/[slug]` followed by `YAMLException`.

### Detection
```python
# Before any insertion, check how many separators exist
n = content.count('\n---\n')
# ca-ES frequently has n=1 — frontmatter only, no body section marker
```

### Safe implementation — always use this
```python
def insert_before_second_separator(content, sentence):
    """
    Insert before the SECOND \\n---\\n only (the body section marker).
    The FIRST \\n---\\n is always the frontmatter end — never insert there.
    Falls back to append_to_last_para if no second separator exists.
    """
    sep = '\n---\n'
    first = content.find(sep)
    if first == -1:
        return append_to_last_para(content, sentence)
    second = content.find(sep, first + len(sep))
    if second == -1:
        return append_to_last_para(content, sentence)   # ← safe fallback
    before = content[:second].rstrip()
    after = content[second:]
    return before + sentence + '\n' + after

def append_to_last_para(content, sentence):
    """Append sentence to the last non-empty line of the file."""
    lines = content.rstrip('\n').split('\n')
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].strip():
            lines[i] += sentence
            return '\n'.join(lines) + '\n'
    return content + sentence
```

### Post-script validation — always run after any bulk insert
```python
errors = []
for path in modified_files:
    with open(path) as f:
        content = f.read()
    svc_idx = content.find(link_to_check)
    yaml_end = content.find('\n---\n')
    if svc_idx != -1 and svc_idx < yaml_end + 10:
        errors.append(f"YAML CORRUPTION: {path} — link at {svc_idx}, yaml_end at {yaml_end}")
if errors:
    raise SystemExit('\n'.join(errors))
print("✓ All links correctly placed after frontmatter")
```

---

## Bug 2 — Cross-locale link leaks

### What went wrong
Haiku agents added internal links using `/en-GB/insights/SLUG` paths inside de-DE, fr-FR, es-ES, etc. articles. 274 cross-locale links were introduced across 77 files.

### Rule
Every `[text](/insights/slug)` link must use:
- The **same locale prefix** as the article's directory
- The **translated slug** for that locale (from `slug-map.json`)

```
/de-DE/insights/ki-agenten-fuer-unternehmen-kompletter-leitfaden  ✓
/en-GB/insights/ai-agents-for-business-complete-guide              ✗ (in a de-DE file)
```

### Fix script
```python
import json, re, os, glob

BLOG = "/path/to/content/blog"
with open(f"{BLOG}/slug-map.json") as f:
    slug_map = json.load(f)

# Build: en-GB-slug → {locale: translated-slug}
en_to_locales = {}
for en_slug, locales in slug_map.items():
    for key in [locales.get("en-GB", en_slug), en_slug]:
        en_to_locales[key] = locales

# Build valid set
valid = set()
for en_slug, locales in slug_map.items():
    for loc, slug in locales.items():
        valid.add(f"{loc}/insights/{slug}")

link_pattern = re.compile(r'/([a-z]{2}-[A-Z]{2})/insights/([a-z0-9-]+)')

for locale_dir in glob.glob(f"{BLOG}/*/"):
    locale = os.path.basename(locale_dir.rstrip('/'))
    for mdx_path in glob.glob(f"{locale_dir}*.mdx"):
        with open(mdx_path) as f:
            content = f.read()
        def fix(m):
            link_locale, slug = m.group(1), m.group(2)
            key = f"{link_locale}/insights/{slug}"
            if key in valid:
                return m.group(0)
            if slug in en_to_locales and link_locale in en_to_locales[slug]:
                return f"/{link_locale}/insights/{en_to_locales[slug][link_locale]}"
            return f"/{link_locale}/insights"  # fallback to index
        new = link_pattern.sub(fix, content)
        if new != content:
            with open(mdx_path, 'w') as f:
                f.write(new)
```

### Post-validation
```python
broken = []
for locale_dir in glob.glob(f"{BLOG}/*/"):
    for mdx_path in glob.glob(f"{locale_dir}*.mdx"):
        with open(mdx_path) as f:
            content = f.read()
        for m in link_pattern.finditer(content):
            if f"{m.group(1)}/insights/{m.group(2)}" not in valid:
                broken.append(f"{mdx_path}: {m.group(0)}")
# Must be 0
```

---

## Bug 3 — Structural JSON keys must never be translated

### What went wrong
An accent-fix script changed `"categories"` → `"catégories"` inside `fr-FR.json` in the `faq` section. The page code reads `faq.categories.flatMap()`, breaking the FAQ page with:

```
TypeError: Cannot read properties of undefined (reading 'flatMap')
```

### Rule
In `i18n/dictionaries/{locale}.json`, **only translate display string values** — never the keys.

```json
// WRONG — key is structural
"faq": {
  "catégories": [...]   ← breaks JS property access
}

// CORRECT
"faq": {
  "categories": [...]   ← key stays in English
}
```

### Detection
After any accent-fix or translation script on JSON files, grep for accented characters in keys:
```bash
python3 -c "
import json, sys
with open('fr-FR.json') as f:
    d = json.load(f)
def check_keys(obj, path=''):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if any(ord(c) > 127 for c in k):
                print(f'ACCENTED KEY at {path}.{k}')
            check_keys(v, path+'.'+k)
check_keys(d)
"
```

---

## Locale char limits for meta titles

The blog linter enforces these. `title + ' | KAUFAST'` must fit within Seobility's 580px limit:

| Locale | Max title chars |
|--------|----------------|
| en-GB, en-US | 50 |
| es-ES, es-MX, ca-ES, fr-FR, it-IT, pt-PT, pt-BR | 45 |
| de-DE, de-AT | 42 |
| sr-RS | 43 |
| ru-RU | 35 |

---

## Locales with structurally incomplete articles

`ca-ES` articles are frequently truncated translations. They end with a placeholder like `[Continua amb...]` and have **no "Related reading" section** — therefore only 1 `\n---\n` in the file. Always use `insert_before_second_separator` (see Bug 1) when editing these files.

Other locale characteristics to watch:
- `ru-RU`: Cyrillic content is ~20% wider per char — very strict title/description limits
- `de-DE/de-AT`: Compound words make titles run long — always count chars explicitly
- `sr-RS`: May also lack "Related reading" blocks in shorter articles
