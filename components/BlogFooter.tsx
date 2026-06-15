import type { Dictionary } from "@/i18n/config";
import styles from "./blog-footer.module.css";

const SITE = "https://kaufast.com";

export function BlogFooter({
  locale,
  dict,
}: {
  locale: string;
  dict: Dictionary;
}) {
  const f = dict.footer;
  const base = `${SITE}/${locale}`;

  const links = [
    { href: `${base}/services`, label: f.services },
    { href: `${base}/works`, label: f.works },
    { href: `${base}/about`, label: f.about },
    { href: `${base}/contact`, label: f.contact },
    { href: `${base}/pricing`, label: f.pricing },
    { href: `${base}/faq`, label: f.faq },
    { href: `/${locale}/insights`, label: f.insights },
    { href: `/${locale}/insights/seo`, label: f.seo },
    { href: `${base}/privacy-policy`, label: f.privacy },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          {links.map((l) => (
            <a key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </a>
          ))}
        </nav>
        <p className={styles.copy}>
          &copy; {new Date().getFullYear()} {f.copyright}
        </p>
      </div>
    </footer>
  );
}
