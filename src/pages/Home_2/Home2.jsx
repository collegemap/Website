import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import "./Home2.css";
import HeroSection from "./HeroSection";
import StepsSection from "./StepsSection";
import ExploreSection from "./ExploreSection";
import ToolsNavSection from "./ToolsNavSection";
import CompareSection from "./CompareSection";
import PathwaysSection from "./PathwaysSection";

import gm1 from '../../assets/GMeetphotos/gm1.jpg';
import gm2 from '../../assets/GMeetphotos/3.png';
import gm3 from '../../assets/GMeetphotos/gm3f.png';
import gm4 from '../../assets/GMeetphotos/gm5.jpg';

const Home2 = () => {
  return (
    <main className="home2-page">
      <Helmet>
        <title>CollegeMap | College Counseling by IITians — Branch Comparison & Predictor</title>
        <meta name="description" content="Get expert college counseling from IITians. Compare branches, predict your college with real JoSAA data, and connect with IIT students for personalized guidance." />
        <link rel="canonical" href="https://collegemap.in/" />
      </Helmet>
      <div className="home2-shell">

        {/* 1. Hero — rank predictor card */}
        <HeroSection />

        {/* 2. 4-step journey */}
        <StepsSection />

        {/* 3. Explore & shortlist tools */}
        <ExploreSection />

        {/* 5. Compare colleges tool section */}
        <CompareSection />

        {/* 8. Branch recommendation */}
        {/* <section className="home2-section home2-compare">
          <div className="home2-compare-content">
            <p className="home2-eyebrow">Branch recommendation</p>
            <h2 className="home2-heading">
              Not sure which college and branch is good? Find top colleges to consider.
            </h2>
            <div className="home2-caution-box">
              <svg className="home2-caution-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="home2-caution-text">
                <strong className="home2-caution-bold">Caution:</strong> it is important to research more in depth before finalizing your branch
              </p>
            </div>
          </div>

          <div className="home2-video-card">
            <div className="home2-video-frame">
              <div className="home2-play" aria-hidden="true">
                <svg viewBox="0 0 48 48" role="img" aria-label="Play">
                  <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 16l14 8-14 8z" fill="currentColor" />
                </svg>
              </div>
              <p>video showing sample</p>
            </div>
          </div>
        </section> */}

        {/* 6. JOSAA / college pathways */}
        <PathwaysSection />

        {/* 7. Connect with IITians */}
        <section className="home2-section home2-compare">
          <div className="home2-compare-content">
            <span className="home2-eyebrow-pill">Connect with college students</span>
            <h2 className="home2-heading home2-heading-tight">Connect with IITians and College students</h2>
            <p className="home2-body">
              Talk to students who have gone through it all. Connect with final year students from your dream college in a 1-to-1 session.
            </p>

            <div className="home2-btn-container">
              <Link className="home2-btn home2-btn-accent home2-btn-talk home2-btn-wide" to="/TalkToIITians">
                Talk now
              </Link>
            </div>
          </div>

          <div className="home2-video-card home2-video-card-centered">
            <div className="home2-graphic-grid home2-graphic-grid-small">
              <div className="home2-graphic-tile home2-graphic-tile-gmeet">
                <img src={gm1} alt="GMeet session 1" className="home2-gmeet-img" />
              </div>
              <div className="home2-graphic-tile home2-graphic-tile-gmeet">
                <img src={gm2} alt="GMeet session 2" className="home2-gmeet-img" />
              </div>
              <div className="home2-graphic-tile home2-graphic-tile-gmeet">
                <img src={gm3} alt="GMeet session 3" className="home2-gmeet-img" />
              </div>
              <div className="home2-graphic-tile home2-graphic-tile-gmeet">
                <img src={gm4} alt="GMeet session 4" className="home2-gmeet-img" />
              </div>
            </div>
          </div>
        </section>




        {/* 4. Quick tools nav */}
        {/* <ToolsNavSection /> */}








      </div>
    </main>
  );
};

export default Home2;
