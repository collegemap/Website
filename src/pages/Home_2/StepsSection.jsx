import React from "react";
import { Link } from "react-router-dom";

const steps = [
  {
    num: "1",
    title: "Predict Colleges",
    desc: "Enter your JEE rank and get a list of colleges you can target with probable chances.",
    cta: "Try Predictor",
    to: "/CollegePredictor",
  },
  {
    num: "2",
    title: "Compare Branches",
    desc: "Compare branches on placements, fees, ROI, college life and much more to choose smartly.",
    cta: "Compare Now",
    to: "/BranchComparision",
  },
  {
    num: "3",
    title: "Talk to IITians",
    desc: "Connect with seniors from top colleges and get honest answers to your doubts.",
    cta: "Talk Now",
    to: "/TalkToIITians",
  },
  {
    num: "4",
    title: "Make Final Decision",
    desc: "Use insights, comparisons and guidance to make the best decision for your future.",
    cta: "Get Started",
    to: "/CollegePredictor",
  },
];

const StepsSection = () => {
  return (
    <section className="home2-section home2-steps-section">
      <div className="home2-steps-header">
        <h2 className="home2-heading">
          Choose Your College in{" "}
          <span style={{ color: "var(--home2-primary)" }}>4 Simple Steps</span>
        </h2>
      </div>
      <div className="home2-steps-grid">
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <div className="home2-step-card">
              <div className="home2-step-num">{step.num}</div>
              <h3 className="home2-step-title">{step.title}</h3>
              <p className="home2-step-desc">{step.desc}</p>
              <Link className="home2-step-cta" to={step.to}>
                {step.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            {i < steps.length - 1 && (
              <div className="home2-step-arrow" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default StepsSection;