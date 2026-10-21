import React from 'react';
import { Helmet } from 'react-helmet-async';
import './Home.css';

import HomeBanner from './HomeBanner';
import TrustedPlatform from './TrustedPlatform';
import HomeHighlights from './HomeHighlights';
import JEEBatches from './JEEBatches';
import StudyResources from './StudyResources';
import JoinFamily from './JoinFamily';
import Team from '../../components/Team/Team';

const HomePage = () => {
  return (
    <div className="homepage-container">
      <Helmet>
        <title>CollegeMap | JEE Prep, College Counseling & Mentorship by IITians</title>
        <meta name="description" content="CollegeMap is your one-stop platform for JEE preparation and college counseling — built by IITians. Access mock tests, study material, PYQs, college predictor, and 1-on-1 IITian mentorship." />
        <link rel="canonical" href="https://collegemap.in/" />
      </Helmet>
      <HomeBanner />
      <elevenlabs-convai agent-id="agent_6001k906ndgzee69c8hjc31kv5fg"></elevenlabs-convai>
      <TrustedPlatform />
      <HomeHighlights />
      <JEEBatches />
      <JoinFamily />
      <StudyResources />
      <Team />
    </div>
  );
};

export default HomePage;