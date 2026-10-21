import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
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

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageViewSentRef = useRef(false);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const { data, error: fetchError } = await supabase
          .from("blogs")
          .select("slug, title, meta_description, image_url, created_at")
          .eq("published", true)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setBlogs(data || []);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError("Failed to load blog posts. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  /* Track blog list page view once blogs are loaded */
  useEffect(() => {
    if (!loading && !pageViewSentRef.current) {
      pageViewSentRef.current = true;
      sendPageView(
        "/blog",
        "Blog | CollegeMap — Insights for JEE & College Admissions"
      );
    }

    if (!loading && blogs.length > 0) {
      trackEvent("blog_list_view", {
        blog_count: blogs.length,
      });
    }
  }, [loading, blogs.length]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="blog-page">
      <Helmet>
        <title>Blog | CollegeMap — Insights for JEE & College Admissions</title>
        <meta
          name="description"
          content="Read the latest articles on JEE preparation, IIT admissions, branch selection, and career guidance from the CollegeMap team."
        />
      </Helmet>

      {/* Hero */}
      <motion.section
        className="blog-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="blog-hero__content">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            CollegeMap Blog
          </motion.h1>
          <motion.p
            className="blog-hero__subtitle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Expert insights on JEE, IITs, branch selection &amp; beyond
          </motion.p>

          {/* Google Analytics Badge */}
          <motion.div
            className="blog-hero__ga-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="ga-badge"
              id="blog-ga-badge"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 20H4V4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 16.5L12 9L15 12L21 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Tracked with Google Analytics
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* Grid */}
      <section className="blog-container">
        {loading ? (
          <div className="blog-state">
            <div className="blog-spinner" />
            <p>Loading posts…</p>
          </div>
        ) : error ? (
          <div className="blog-state blog-state--error">
            <span className="blog-state__icon">⚠️</span>
            <h3>{error}</h3>
            <button
              className="blog-retry-btn"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : blogs.length === 0 ? (
          <div className="blog-state">
            <span className="blog-state__icon">📝</span>
            <h3>No posts yet</h3>
            <p>Check back soon — we're writing something great!</p>
          </div>
        ) : (
          <div className="blog-grid">
            {blogs.map((blog, index) => (
              <motion.div
                key={blog.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Link
                  to={`/blog/${blog.slug}`}
                  className="blog-card"
                  id={`blog-card-${blog.slug}`}
                  onClick={() =>
                    trackEvent("blog_card_click", {
                      blog_slug: blog.slug,
                      blog_title: blog.title,
                      card_position: index + 1,
                    })
                  }
                >
                  {blog.image_url && (
                    <div className="blog-card__image-wrapper">
                      <img
                        src={blog.image_url}
                        alt={blog.title}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="blog-card__body">
                    <span className="blog-card__date">
                      {formatDate(blog.created_at)}
                    </span>
                    <h2 className="blog-card__title">{blog.title}</h2>
                    {blog.meta_description && (
                      <p className="blog-card__desc">{blog.meta_description}</p>
                    )}
                    <span className="blog-card__cta">
                      Read Article
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M3 8h10M9 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
