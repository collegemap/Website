import React from "react";
import { Link } from "react-router-dom";

const tools = [
  {
    title: "College Predictor",
    desc: "Predict colleges you can get based on your rank",
    cta: "Try Now",
    to: "/CollegePredictor",
    color: "#10c3bc",
    // bg: "#e6faf9",
    // icon: (
    //   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10c3bc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    //     <circle cx="12" cy="12" r="9" />
    //     <path d="M12 6v6l4 2" />
    //   </svg>
    // ),
  },
  {
    title: "Branch Comparison",
    desc: "Compare branches, placements, fees, ROI and more",
    cta: "Compare",
    to: "/BranchComparision",
    color: "#10c3bc",
    bg: "#f0effe",
    // icon: (
    //   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c6ff7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    //     <path d="M8 3v4M16 3v4M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
    //   </svg>
    // ),
  },
  {
    title: "Talk to IITians",
    desc: "Connect with seniors from top colleges",
    cta: "Connect",
    to: "/TalkToIITians",
    color: "#10c3bc",
    bg: "#fefce8",
    // icon: (
    //   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    //     <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    //     <circle cx="9" cy="7" r="4" />
    //     <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    //   </svg>
    // ),
  },
  {
    title: "Counselling Guide",
    desc: "Complete JoSAA counselling process explained",
    cta: "Explore",
    to: "/College",
    color: "#10c3bc",
    bg: "#ecfdf5",
    // icon: (
    //   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    //     <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    //     <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    //     <path d="M8 7h8M8 11h8M8 15h5" />
    //   </svg>
    // ),
  },
  {
    title: "Read About Colleges",
    desc: "Detailed insights about colleges across India",
    cta: "Read Now",
    to: "/College",
    color: "#10c3bc",
    bg: "#eff6ff",
    // icon: (
    //   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    //     <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    //     <path d="M9 22V12h6v10" />
    //   </svg>
    // ),
  },
];

const ToolsNavSection = () => {
  return (
    <section className="home2-section home2-toolsnav-section">
      <div className="home2-toolsnav-header">
        <h2 className="home2-heading">What are you looking for today?</h2>
        <p className="home2-body">All the tools and resources you need, in one place.</p>
      </div>
      <div className="home2-toolsnav-grid">
        {tools.map((tool) => (
          <div key={tool.title} className="home2-toolsnav-card">
            {/* <div className="home2-toolsnav-icon" style={{ background: tool.bg }}>
              {tool.icon}
            </div> */}
            <div className="home2-toolsnav-title-wrap">
              <span className="home2-toolsnav-title-pill">{tool.title}</span>
            </div>
            <p className="home2-toolsnav-desc">{tool.desc}</p>
            <Link
              className="home2-toolsnav-cta"
              to={tool.to}
              style={{ color: tool.color, borderColor: tool.color + "44" }}
            >
              {tool.cta}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ToolsNavSection;
