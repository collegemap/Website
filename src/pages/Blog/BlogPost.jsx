import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "../../supabaseClient";
import "./Blog.scss";

/** Send a GA4 custom event (safe no-op if gtag isn't loaded) */
const trackEvent = (eventName, params = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
};

const sendPageView = (pagePath, pageTitle) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: `${window.location.origin}${pagePath}`,
      page_title: pageTitle,
      page_referrer: document.referrer || undefined,
    });
  }
};

export default function BlogPost() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const pageViewSentRef = useRef(false);

  // Scroll-depth tracking refs
  const scrollMilestonesRef = useRef(new Set());
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    async function fetchBlog() {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("slug", slug)
          .eq("published", true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setBlog(data);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchBlog();
  }, [slug]);

  /* ── GA: blog_post_view ── */
  useEffect(() => {
    if (!loading && !pageViewSentRef.current) {
      pageViewSentRef.current = true;
      sendPageView(
        `/blog/${slug}`,
        blog ? `${blog.title} | CollegeMap Blog` : "Post not found | CollegeMap Blog"
      );
    }

    if (blog) {
      trackEvent("blog_post_view", {
        blog_slug: blog.slug,
        blog_title: blog.title,
        content_length: blog.content ? blog.content.length : 0,
      });
    }
  }, [blog, loading, slug]);

  /* ── GA: scroll-depth milestones (25 / 50 / 75 / 100 %) ── */
  useEffect(() => {
    if (!blog) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.round((scrollTop / docHeight) * 100);
      const milestones = [25, 50, 75, 100];

      milestones.forEach((m) => {
        if (pct >= m && !scrollMilestonesRef.current.has(m)) {
          scrollMilestonesRef.current.add(m);
          trackEvent("blog_post_scroll", {
            blog_slug: blog.slug,
            blog_title: blog.title,
            scroll_depth: m,
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [blog]);

  /* ── GA: estimated read time on unmount ── */
  useEffect(() => {
    if (!blog) return;

    const postSlug = blog.slug;
    const postTitle = blog.title;
    const entryTime = startTimeRef.current;

    return () => {
      const seconds = Math.round((Date.now() - entryTime) / 1000);
      trackEvent("blog_post_read_time", {
        blog_slug: postSlug,
        blog_title: postTitle,
        read_time_seconds: seconds,
      });
    };
  }, [blog]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="blog-page">
        <div className="blog-post-loading">
          <div className="blog-spinner" />
          <p>Loading article…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="blog-page">
        <div className="blog-not-found">
          <span className="blog-not-found__icon">📄</span>
          <h2>Post not found</h2>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/blog" className="blog-back-link">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <Helmet>
        <title>{blog.title} | CollegeMap Blog</title>
        {blog.meta_description && (
          <meta name="description" content={blog.meta_description} />
        )}
        {/* Open Graph */}
        <meta property="og:title" content={`${blog.title} | CollegeMap`} />
        {blog.meta_description && (
          <meta property="og:description" content={blog.meta_description} />
        )}
        {blog.image_url && (
          <meta property="og:image" content={blog.image_url} />
        )}
        <meta property="og:type" content="article" />
      </Helmet>

      <motion.article
        className="blog-post"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back link */}
        <Link to="/blog" className="blog-post__back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M13 8H3M7 4L3 8l4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All Posts
        </Link>

        {/* Header */}
        <header className="blog-post__header">
          <span className="blog-post__date">{formatDate(blog.created_at)}</span>
          <h1 className="blog-post__title">{blog.title}</h1>
          {blog.meta_description && (
            <p className="blog-post__excerpt">{blog.meta_description}</p>
          )}
        </header>

        {/* Cover image */}
        {blog.image_url && (
          <div className="blog-post__cover">
            <img src={blog.image_url} alt={blog.title} />
          </div>
        )}

        {/* Markdown content */}
        <div className="blog-post__content">
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </div>

        {/* Footer */}
        <footer className="blog-post__footer">
          <Link to="/blog" className="blog-back-link">
            ← Back to Blog
          </Link>
        </footer>
      </motion.article>
    </div>
  );
}
