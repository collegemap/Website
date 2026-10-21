import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './CollegePredictor.scss';

export default function CollegePredictor() {
  const navigate = useNavigate();

  return (
    <div className="cp-page">
      <Helmet>
        <title>JEE College Predictor 2026 | Predict Your IIT, NIT & IIIT — CollegeMap</title>
        <meta name="description" content="Predict your IIT, NIT, or IIIT admission based on your JEE Main & Advanced rank. Powered by official JoSAA cutoff data with category-wise, branch-level, and round-wise analysis." />
        <link rel="canonical" href="https://collegemap.in/CollegePredictor" />
      </Helmet>
      <section className="cp-hero">
        <div className="cp-hero-left">
          <p className="cp-small-heading">COLLEGE PREDICTOR</p>
          <h1 className="cp-main-heading">
            Find the <span>Best Colleges</span>
            <br />
            Within Your Reach
          </h1>
          <div className="cp-question-tags">
            <div className="cp-tag">"What are my <b>safest options</b>?"</div>
            <div className="cp-tag">"Which colleges fit my <b>category</b> and <b>rank</b>?"</div>
            <div className="cp-tag">"Can I get a <b>better branch</b> with this rank?"</div>
            <button className="cp-hero-start-btn" onClick={() => navigate('/CollegePredictor/tool')}>
              Start Now
            </button>
          </div>
        </div>
        <div className="cp-hero-right">
          <div className="cp-image-box">
            <img src="/college-predictor.jpg" alt="College Predictor" />
          </div>
        </div>
      </section>

      <section className="cp-info-section">
        <h2>Know your options before counselling begins.</h2>
        <p>
          Every student faces uncertainty during counselling season —
          whether their rank is enough, which colleges are achievable,
          and what choices are safest.
        </p>
        <p>
          Predict colleges based on your exam, rank, category,
          gender, and preferred branches to make smarter
          counselling decisions with confidence.
        </p>
      </section>

      {/* Bottom nav bar — same pattern as Talk to IITian */}
      <div className="cp-bottom-nav">
        <div className="cp-bottom-nav-steps">
          <span>Enter your rank</span>
          <span className="cp-nav-arrow">→</span>
          <span>Choose preferences</span>
          <span className="cp-nav-arrow">→</span>
          <span>See your colleges</span>
        </div>
        <button className="cp-start-btn" onClick={() => navigate('/CollegePredictor/tool')}>
          Start Now
        </button>
      </div>
    </div>
  );
}