#!/usr/bin/env python3
"""
Round 2: Add internal links to articles with <3 internal links.
Target locales: it-IT, sr-RS, ca-ES, es-MX, pt-BR, pt-PT, ru-RU, de-AT, fr-FR, es-ES

Safety rules (from docs/bulk-mdx-editing-patterns.md):
- Only use slugs from slug-map.json (never invent slugs, never use en-GB slugs in other locales)
- Use insert_before_second_separator (not rfind) to avoid YAML corruption
- Post-validate every modified file
"""

import glob, json, re, sys

BLOG = '/Users/melchor/WebDev/kaufast/kaufast-blog/content/blog'
SLUG_MAP_PATH = f'{BLOG}/slug-map.json'

TARGET_LOCALES = ['it-IT', 'sr-RS', 'ca-ES', 'es-MX', 'pt-BR', 'pt-PT', 'ru-RU', 'de-AT', 'fr-FR', 'es-ES']

LEARN_MORE = {
    'en-GB': 'Learn more about',
    'en-US': 'Learn more about',
    'de-DE': 'Mehr dazu:',
    'de-AT': 'Mehr dazu:',
    'fr-FR': 'Voir aussi :',
    'es-ES': 'Más información:',
    'es-MX': 'Más información:',
    'ca-ES': 'Llegiu més sobre',
    'it-IT': 'Scopri di più su',
    'pt-PT': 'Saiba mais sobre',
    'pt-BR': 'Saiba mais sobre',
    'ru-RU': 'Подробнее:',
    'sr-RS': 'Saznajte više o',
}

# Semantic clusters (en-GB slugs). Articles in the same cluster link to each other.
CLUSTERS = [
    # WhatsApp / hospitality automation
    [
        'whatsapp-bot-for-business-complete-guide',
        'whatsapp-bot-for-restaurants-reservations-orders',
        'whatsapp-bot-real-estate-qualify-buyers-leads',
        'automate-restaurant-reservations-complete-guide',
        'ai-receptionist-for-clinics-appointments-patients-no-shows',
    ],
    # AI agents / business automation
    [
        'ai-agents-for-business-complete-guide',
        'business-automation-complete-guide',
        '5-business-processes-every-smb-should-automate',
        'how-to-choose-it-consulting-partner',
    ],
    # SEO strategy
    [
        'seo-strategies-that-actually-work',
        'bad-seo-is-worse-than-no-seo',
        'why-seo-is-never-done',
        'how-to-measure-the-success-of-your-seo-strategy',
        'convert-more-visitors-into-customers-with-these-seo-strategies',
        'seo-vs-paid-ads-which-strategy-is-better-for-you',
        'seo-agency-barcelona-guide',
        'how-to-attract-local-customers-with-seo',
        'first-phase-of-marketing-is-learning',
    ],
    # SEO technical / GEO
    [
        'seo-isnt-dead-ai-brain-hybrid-visibility-guide-2026',
        'from-seo-to-seo-geo-what-changed-in-2026',
        'optimise-for-bing-duckduckgo-perplexity-claude',
        'programmatic-seo-guide',
        'linkedin-seo-how-social-content-drives-growth',
    ],
    # AI visibility
    [
        'how-ai-is-changing-how-people-find-businesses',
        'is-your-business-visible-to-chatgpt-how-to-check',
        'why-your-business-needs-to-be-ai-ready',
        'seo-isnt-dead-ai-brain-hybrid-visibility-guide-2026',
        'from-seo-to-seo-geo-what-changed-in-2026',
    ],
    # Performance / speed
    [
        'why-site-speed-affects-seo',
        'web-performance-revenue-case-studies',
    ],
    # Online visibility basics
    [
        '5-easy-ways-to-make-your-business-more-visible-online',
        'how-google-discovers-your-article',
        'building-for-the-web-since-2004-what-actually-changed',
        'linkedin-seo-how-social-content-drives-online-growth',
    ],
    # GDPR / compliance
    [
        'gdpr-fines-invented-rules-compliance-guide',
        'whatsapp-bot-for-business-complete-guide',
    ],
    # Case studies / company
    [
        'women-safety-uk-audra-launch',
        'echoflicks-ai-writes-about-us-7-days',
        'building-for-the-web-since-2004-what-actually-changed',
    ],
]

# Build: en-slug -> list of related en-slugs (from same cluster)
slug_to_related = {}
for cluster in CLUSTERS:
    for slug in cluster:
        related = [s for s in cluster if s != slug]
        if slug not in slug_to_related:
            slug_to_related[slug] = []
        for r in related:
            if r not in slug_to_related[slug]:
                slug_to_related[slug].append(r)


def insert_before_second_separator(content, sentence):
    """Insert before the SECOND \\n---\\n only. Falls back to end-of-body if no second separator."""
    sep = '\n---\n'
    first = content.find(sep)
    if first == -1:
        return append_to_body_end(content, sentence)
    second = content.find(sep, first + len(sep))
    if second == -1:
        return append_to_body_end(content, sentence)
    before = content[:second].rstrip()
    after = content[second:]
    return before + '\n\n' + sentence + '\n' + after


def append_to_body_end(content, sentence):
    """Append sentence as a new paragraph at the end of the file body."""
    return content.rstrip('\n') + '\n\n' + sentence + '\n'


def get_title(locale, locale_slug):
    path = f'{BLOG}/{locale}/{locale_slug}.mdx'
    try:
        with open(path) as f:
            content = f.read()
        m = re.search(r'^title: "(.+)"', content, re.MULTILINE)
        if m:
            return m.group(1)
    except FileNotFoundError:
        pass
    return None


def get_existing_locale_slugs(content, locale):
    """Return set of locale slugs already linked in this article."""
    pattern = re.compile(r'\(/' + re.escape(locale) + r'/insights/([a-z0-9-]+)\)')
    return set(m.group(1) for m in pattern.finditer(content))


def count_internal_links(content, locale):
    return content.count(f'/{locale}/insights/')


def main():
    with open(SLUG_MAP_PATH) as f:
        slug_map = json.load(f)

    # Build reverse map: (locale, locale_slug) -> en_slug
    locale_to_en = {}
    for en_slug, locs in slug_map.items():
        for loc, ls in locs.items():
            locale_to_en[(loc, ls)] = en_slug

    total_modified = 0
    all_errors = []

    for locale in TARGET_LOCALES:
        locale_dir = f'{BLOG}/{locale}'
        mdx_files = sorted(glob.glob(f'{locale_dir}/*.mdx'))
        locale_modified = 0
        locale_skipped = 0

        for mdx_path in mdx_files:
            locale_slug = mdx_path.split('/')[-1].replace('.mdx', '')

            with open(mdx_path) as f:
                original = f.read()

            current_count = count_internal_links(original, locale)
            if current_count >= 3:
                continue

            en_slug = locale_to_en.get((locale, locale_slug))
            if en_slug is None:
                locale_skipped += 1
                continue

            existing_linked = get_existing_locale_slugs(original, locale)
            related_en_slugs = slug_to_related.get(en_slug, [])

            # Find candidate links to add
            candidates = []
            for rel_en in related_en_slugs:
                if rel_en not in slug_map:
                    continue
                rel_locale_slug = slug_map[rel_en].get(locale)
                if not rel_locale_slug:
                    continue
                if rel_locale_slug in existing_linked:
                    continue
                title = get_title(locale, rel_locale_slug)
                if not title:
                    continue
                candidates.append((rel_locale_slug, title))

            links_needed = 3 - current_count
            to_add = candidates[:links_needed]

            if not to_add:
                locale_skipped += 1
                continue

            content = original
            learn_more = LEARN_MORE.get(locale, 'Learn more about')

            for rel_slug, rel_title in to_add:
                link_text = f'{learn_more} [{rel_title}](/{locale}/insights/{rel_slug}).'
                content = insert_before_second_separator(content, link_text)

            # Post-validate: no link should appear before yaml_end
            yaml_end = content.find('\n---\n')
            file_ok = True
            for rel_slug, _ in to_add:
                link_pos = content.find(f'/{locale}/insights/{rel_slug}')
                if link_pos != -1 and link_pos < yaml_end + 10:
                    all_errors.append(f'YAML CORRUPTION: {mdx_path} — link at {link_pos}, yaml_end at {yaml_end}')
                    file_ok = False

            if file_ok:
                with open(mdx_path, 'w') as f:
                    f.write(content)
                locale_modified += 1
                added_slugs = [s for s, _ in to_add]
                print(f'  + {locale_slug} (+{len(to_add)}: {", ".join(added_slugs)})')

        print(f'{locale}: {locale_modified} modified, {locale_skipped} skipped (no cluster match)')
        total_modified += locale_modified

    print(f'\nTotal: {total_modified} articles modified')

    if all_errors:
        print('\n--- ERRORS ---')
        for e in all_errors:
            print(e)
        sys.exit(1)
    else:
        print('✓ All links correctly placed after frontmatter')


if __name__ == '__main__':
    main()
