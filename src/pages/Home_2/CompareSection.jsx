import React from "react";
import { Link } from "react-router-dom";

const compareHighlights = [
  "Compare 2 branches across any college.",
  "Ask questions like IIT vs NIT in one click.",
  "Make the right choice with real data.",
];

const promptChips = ["IIT vs NIT", "CSE vs ECE", "ROI check", "Campus life", "Placements"];

const CompareSection = () => {
  return (
    <section className="home2-section home2-compare">
      <div className="home2-compare-content">
        <span className="home2-eyebrow-pill">Compare Colleges</span>
        <h2 className="home2-heading">Compare colleges with this tool</h2>
        <p className="home2-body">
          Chemical Eng at IIT or CSE at NIT? Find answers to all such questions in one place.
        </p>

        <ul className="home2-compare-points">
          {compareHighlights.map((item) => (
            <li key={item}>
              <span className="home2-check-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.15" />
                  <path
                    d="M4.5 8.2l2.2 2.2 4.8-4.8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="home2-prompt home2-prompt-compact">
          <div className="home2-chip-row">
            {promptChips.map((chip) => (
              <span key={chip} className="home2-chip">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <Link className="home2-btn home2-btn-accent home2-btn-auto" to="/BranchComparision">
          Try now for free
        </Link>
      </div>

      <div className="home2-video-card">
        <div className="home2-video-frame home2-video-frame--playing">
          <video
            className="home2-video-el"
            controls
            playsInline
            src="/branch_comp.mp4"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
};

export default CompareSection;