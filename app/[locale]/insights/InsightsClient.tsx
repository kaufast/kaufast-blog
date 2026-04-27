"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostSummary } from "@/lib/blog";
import { blogImageUrl } from "@/lib/seo";
import styles from "./insights.module.css";

type Props = {
  posts: PostSummary[];
  locale: string;
  labelAll: string;
  labelReadMore: string;
  labelMinRead: string;
};

export default function InsightsClient({
  posts,
  locale,
  labelAll,
  labelReadMore,
  labelMinRead,
}: Props) {
  const categories = Array.from(
    new Set(posts.map((p) => p.frontmatter.category))
  );
  const [active, setActive] = useState(labelAll);

  const filtered =
    active === labelAll
      ? posts
      : posts.filter((p) => p.frontmatter.category === active);

  return (
    <>
      {/* Filter pills */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterPill} ${active === labelAll ? styles.filterPillActive : ""}`}
          onClick={() => setActive(labelAll)}
        >
          {labelAll}
          <span className={styles.filterCount}>{posts.length}</span>
        </button>
        {categories.map((cat) => {
          const count = posts.filter(
            (p) => p.frontmatter.category === cat
          ).length;
          return (
            <button
              key={cat}
              className={`${styles.filterPill} ${active === cat ? styles.filterPillActive : ""}`}
              onClick={() => setActive(cat)}
            >
              {cat}
              <span className={styles.filterCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className={styles.postsGrid}>
        {filtered.map((post) => (
          <Link
            key={post.slug}
            href={`/${locale}/insights/${post.slug}`}
            className={styles.card}
          >
            {post.frontmatter.image && (
              <img
                className={styles.cardImage}
                src={blogImageUrl(post.frontmatter.image)}
                alt={post.frontmatter.title}
                loading="lazy"
              />
            )}
            <div className={styles.cardBody}>
              <div className={styles.cardCategory}>
                {post.frontmatter.category}
              </div>
              <h2 className={styles.cardTitle}>{post.frontmatter.title}</h2>
              <p className={styles.cardExcerpt}>{post.frontmatter.headline}</p>
              {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                <div className={styles.cardTags}>
                  {post.frontmatter.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.cardTag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.cardMeta}>
                <span>{post.frontmatter.date}</span>
                <span className={styles.cardMetaDot} />
                <span>
                  {post.readingTime} {labelMinRead}
                </span>
                <span className={styles.cardMetaDot} />
                <span>{labelReadMore}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
