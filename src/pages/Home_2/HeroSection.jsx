import React from "react";
import { Link } from "react-router-dom";

const avatars = [
  { initials: "AR", bg: "#10c3bc" },
  { initials: "SK", bg: "#0a97a0" },
  { initials: "PM", bg: "#005d63" },
  { initials: "RV", bg: "#0b7a82" },
];

const HeroSection = () => {
  return (
    <section className="home2-section home2-hero">
      <div className="home2-hero-content">
        {/* <p className="home2-eyebrow">College Finder</p> */}
        <h1 className="home2-title">
          Find the Right College,<br />
          Choose the Right Branch,<br />
          Build the Right{" "}
          <span style={{ color: "var(--home2-primary)" }}>Future.</span>
        </h1>
        <p className="home2-subtitle">
          Compare colleges, predict admissions, understand counselling and connect
          with IITians — all in one place.
        </p>

        <div className="home2-cta-row">
          <Link className="home2-btn home2-btn-primary" to="/CollegePredictor">
            Predict My College
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link className="home2-btn home2-btn-ghost" to="/BranchComparision">
            Compare Colleges
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link className="home2-btn home2-btn-ghost" to="/TalkToIITians">
            Talk to IITian
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* <div className="home2-trust-row">
          <div className="home2-avatar-stack">
            {avatars.map((a) => (
              <div
                key={a.initials}
                className="home2-avatar"
                style={{ background: a.bg }}
              >
                {a.initials}
              </div>
            ))}
          </div>
          <span className="home2-trust-label">Trusted by thousands of JEE aspirants</span>
        </div> */}
      </div>

      <div className="home2-hero-visual" aria-hidden="true">
        <div className="home2-graphic-card">
          <div className="home2-graphic-header">
            <span>Your JEE Main Rank</span>
          </div>
          <div className="home2-rank-display">
            <span className="home2-rank-num">12,500</span>
            <span className="home2-rank-badge">Percentile: 98.4</span>
          </div>
          <div className="home2-graphic-subheader">Colleges you can target</div>
          <div className="home2-college-list">
            <div className="home2-college-row">
              <div className="home2-college-icon home2-college-icon--nit">N</div>
              <div className="home2-college-info">
                <span className="home2-college-name">NIT Calicut</span>
                <span className="home2-college-branch">Computer Science</span>
              </div>
              <span className="home2-chance home2-chance--high">High Chance</span>
            </div>
            <div className="home2-college-row">
              <div className="home2-college-icon home2-college-icon--nit">N</div>
              <div className="home2-college-info">
                <span className="home2-college-name">NIT Trichy</span>
                <span className="home2-college-branch">Instrumentation &amp; Control</span>
              </div>
              <span className="home2-chance home2-chance--high">High Chance</span>
            </div>
            <div className="home2-college-row">
              <div className="home2-college-icon home2-college-icon--iiit">I</div>
              <div className="home2-college-info">
                <span className="home2-college-name">IIIT Hyderabad</span>
                <span className="home2-college-branch">Electronics &amp; Communication</span>
              </div>
              <span className="home2-chance home2-chance--good">Good Chance</span>
            </div>
          </div>
          <Link className="home2-view-full" to="/CollegePredictor">
            View full prediction
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="home2-hero-orb" />
      </div>
    </section>
  );
};

export default HeroSection;
