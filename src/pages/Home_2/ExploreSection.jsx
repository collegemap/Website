import React from "react";
import { Link } from "react-router-dom";

const CollegeExplorerIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#10c3bc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="14" width="22" height="28" rx="3" />
    <path d="M14 8h22a3 3 0 0 1 3 3v28" />
    <path d="M14 22h10M14 28h10M14 34h6" />
  </svg>
);

const CollegeComparisonIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#7c6ff7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="10" width="18" height="28" rx="3" />
    <rect x="26" y="10" width="18" height="28" rx="3" />
    <path d="M13 18h0M13 24h0M13 30h0" strokeWidth="3" strokeLinecap="round" />
    <path d="M35 18h0M35 24h0M35 30h0" strokeWidth="3" strokeLinecap="round" />
    <path d="M22 24h4" />
  </svg>
);

const CutoffExplorerIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="36" height="36" rx="4" />
    <path d="M14 34l6-10 6 6 6-14" />
    <circle cx="14" cy="34" r="2" fill="#f59e0b" stroke="none" />
    <circle cx="20" cy="24" r="2" fill="#f59e0b" stroke="none" />
    <circle cx="26" cy="30" r="2" fill="#f59e0b" stroke="none" />
    <circle cx="34" cy="16" r="2" fill="#f59e0b" stroke="none" />
  </svg>
);

const PredictorIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="24" cy="24" r="18" />
    <path d="M24 12v12l8 4" />
    <path d="M12 24h4M32 24h4M24 12v4M24 32v4" />
  </svg>
);

const tools = [
  {
    // icon: <CollegeExplorerIcon />,
    color: "#10c3bc",
    title: "College Explorer",
    desc: "Explore top colleges in India with ratings, reviews, placements, campus life and more.",
    points: ["Ratings & Reviews", "Placements", "Campus Life,Cutoffs"],
    cta: "Explore Colleges",
    to: "/College",
  },
  {
    // icon: <CollegeComparisonIcon />,
    color: "#10c3bc",
    title: "College Comparison",
    desc: "Compare colleges side-by-side on placements, fees, ranking, campus and other factors.",
    points: ["Side-by-side comparison", "Multiple filters", "Save & share"],
    cta: "Compare Colleges",
    to: "/BranchComparision",
  },
  {
    // icon: <CutoffExplorerIcon />,
    color: "#10c3bc",
    title: "Cutoff Explorer",
    desc: "Check previous year cutoffs for JEE Main to understand closing ranks and trends.",
    points: ["Year-wise cutoffs", "Category filters", "Branch-wise data"],
    cta: "Check Cutoffs",
    to: "/CollegePredictor",
  },
  {
    // icon: <PredictorIcon />,
    color: "#10c3bc",
    title: "College Predictor",
    desc: "Predict colleges you can get based on your JEE Main rank and category.",
    points: ["AI-based prediction", "Probable chances", "Smart recommendations"],
    cta: "Try Predictor",
    to: "/CollegePredictor",
  },
];

const ExploreSection = () => {
  return (
    <section className="home2-section home2-explore-section">
      <div className="home2-explore-header">
        <h2 className="home2-heading">Explore and Shortlist the Best Colleges</h2>
        <p className="home2-body">In-depth information to help you make confident decisions.</p>
      </div>
      <div className="home2-explore-grid">
        {tools.map((tool) => (
          <div key={tool.title} className="home2-explore-card">
            <div className="home2-explore-icon">{tool.icon}</div>
            <div className="home2-explore-title-wrap">
              <span className="home2-explore-title-pill">{tool.title}</span>
            </div>
            <p className="home2-explore-desc">{tool.desc}</p>
            <ul className="home2-explore-points">
              {tool.points.map((p) => (
                <li key={p}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tool.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
            <Link className="home2-btn home2-btn-primary home2-explore-cta" to={tool.to} style={{ background: tool.color, boxShadow: `0 8px 20px ${tool.color}33` }}>
              {tool.cta}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExploreSection;
