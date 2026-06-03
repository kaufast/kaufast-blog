"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PostSummary } from "@/lib/blog";
import { blogImageUrl } from "@/lib/seo";
import styles from "./insights.module.css";

type Labels = {
  all: string;
  readMore: string;
  minRead: string;
  tabLatest: string;
  tabNewest: string;
  tabPopular: string;
  searchPlaceholder: string;
  searchNoResults: string;
  commentsTitle: string;
  commentsPlaceholder: string;
  commentsSubmit: string;
  commentsEmpty: string;
  commentsName: string;
  commentsPosted: string;
};

type Comment = {
  id: string;
  name: string;
  text: string;
  date: string;
};

type Props = {
  posts: PostSummary[];
  locale: string;
  labels: Labels;
};

function parseDate(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export default function InsightsClient({ posts, locale, labels }: Props) {
  const categories = Array.from(
    new Set(posts.map((p) => p.frontmatter.category))
  );

  const [activeCategory, setActiveCategory] = useState(labels.all);
  const [activeTab, setActiveTab] = useState<"latest" | "newest" | "popular">("latest");
  const [search, setSearch] = useState("");

  // Comments state (localStorage-backed)
  const [comments, setComments] = useState<Comment[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("kf-insights-comments");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");

  const filtered = useMemo(() => {
    let result = activeCategory === labels.all
      ? posts
      : posts.filter((p) => p.frontmatter.category === activeCategory);

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.frontmatter.title.toLowerCase().includes(q) ||
          p.frontmatter.headline.toLowerCase().includes(q) ||
          (p.frontmatter.tags && p.frontmatter.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Sort by tab
    if (activeTab === "newest") {
      result = [...result].sort(
        (a, b) => parseDate(b.frontmatter.date) - parseDate(a.frontmatter.date)
      );
    } else if (activeTab === "popular") {
      // Popular = featured first, then longest read time (proxy for depth/engagement)
      result = [...result].sort((a, b) => {
        if (a.frontmatter.featured && !b.frontmatter.featured) return -1;
        if (!a.frontmatter.featured && b.frontmatter.featured) return 1;
        return b.readingTime - a.readingTime;
      });
    }
    // "latest" keeps the default date sort from the server

    return result;
  }, [posts, activeCategory, activeTab, search, labels.all]);

  function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      name: commentName.trim(),
      text: commentText.trim(),
      date: new Date().toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    setCommentName("");
    setCommentText("");

    try {
      localStorage.setItem("kf-insights-comments", JSON.stringify(updated));
    } catch { /* quota exceeded */ }
  }

  const tabs = [
    { key: "latest" as const, label: labels.tabLatest },
    { key: "newest" as const, label: labels.tabNewest },
    { key: "popular" as const, label: labels.tabPopular },
  ];

  return (
    <>
      {/* Search bar */}
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8.5" cy="8.5" r="6" />
          <path d="M13 13l4.5 4.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={labels.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category filter pills */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterPill} ${activeCategory === labels.all ? styles.filterPillActive : ""}`}
          onClick={() => setActiveCategory(labels.all)}
        >
          {labels.all}
          <span className={styles.filterCount}>{posts.length}</span>
        </button>
        {categories.map((cat) => {
          const count = posts.filter(
            (p) => p.frontmatter.category === cat
          ).length;
          return (
            <button
              key={cat}
              className={`${styles.filterPill} ${activeCategory === cat ? styles.filterPillActive : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              <span className={styles.filterCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className={styles.noResults}>{labels.searchNoResults}</p>
      ) : (
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
                    {post.readingTime} {labels.minRead}
                  </span>
                  <span className={styles.cardMetaDot} />
                  <span>{labels.readMore}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Comments */}
      <section className={styles.commentsSection}>
        <h2 className={styles.commentsTitle}>{labels.commentsTitle}</h2>

        <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
          <input
            type="text"
            className={styles.commentNameInput}
            placeholder={labels.commentsName}
            value={commentName}
            onChange={(e) => setCommentName(e.target.value)}
            maxLength={80}
            required
          />
          <textarea
            className={styles.commentTextarea}
            placeholder={labels.commentsPlaceholder}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            maxLength={2000}
            required
          />
          <button type="submit" className={styles.commentSubmit}>
            {labels.commentsSubmit}
          </button>
        </form>

        {comments.length === 0 ? (
          <p className={styles.commentsEmpty}>{labels.commentsEmpty}</p>
        ) : (
          <div className={styles.commentsList}>
            {comments.map((c) => (
              <div key={c.id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{c.name}</span>
                  <span className={styles.commentDate}>
                    {labels.commentsPosted} {c.date}
                  </span>
                </div>
                <p className={styles.commentBody}>{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
