import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './BranchComparison.scss';

export default function BranchComparisonIntro() {
  const navigate = useNavigate();

  return (
    <div className="bc-page">
      <Helmet>
        <title>Branch Comparison Tool | Compare Different College Branches — CollegeMap</title>
        <meta name="description" content="Compare different college branches side-by-side on placements, packages, future scope, and opportunities. Make a data-driven decision between college vs branch with real IITian insights." />
        <link rel="canonical" href="https://collegemap.in/BranchComparision" />
      </Helmet>
      <section className="bc-hero">
        <div className="bc-hero-left">
          <p className="bc-small-heading">BRANCH COMPARISON</p>
          <h1 className="bc-main-heading">
            Choose <span>Smarter</span>,<br />Not Randomly.
          </h1>
          <div className="bc-question-tags">
            <div className="bc-tag">"Should I prioritize <b>college</b> or <b>branch</b>?"</div>
            <div className="bc-tag">"Which choice fits my <b>goals</b> better?"</div>
            <div className="bc-tag">"Which option gives better <b>opportunities</b>?"</div>
            <button className="bc-hero-start-btn" onClick={() => navigate('/BranchComparision/tool')}>
              Start Now
            </button>
          </div>
        </div>
        <div className="bc-hero-right">
          <div className="bc-image-box">
            <img src="/branch-comparison2.png" alt="Branch Comparison" />
          </div>
        </div>
      </section>

      <section className="bc-info-section">
        <h2>Compare before you commit four years of your life.</h2>
        <p>
          Every student faces the same dilemma — college or branch.
        </p>
        <p>
          Compare institutes, branches, placements, opportunities, and future
          scope side-by-side to make a smarter decision.
        </p>
      </section>

      {/* Bottom sticky nav bar */}
      <div className="bc-bottom-nav">
        <div className="bc-bottom-nav-steps">
          <span>Pick two branches</span>
          <span className="bc-nav-arrow">→</span>
          <span>Compare side-by-side</span>
          <span className="bc-nav-arrow">→</span>
          <span>Make a smarter choice</span>
        </div>
        <button className="bc-start-btn" onClick={() => navigate('/BranchComparision/tool')}>
          Start Now
        </button>
      </div>
    </div>
  );
}