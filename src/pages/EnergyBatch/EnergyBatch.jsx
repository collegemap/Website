import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './EnergyBatch.scss';

const INQUIRE_WHATSAPP_URL =
  'https://api.whatsapp.com/send?phone=919326602765&text=Hi%2C%20I%20would%20like%20to%20inquire%20about%20IITian%20Guidance%20for%20JEE%20Preparation..';
const MENTORSHIP_IMG = `${process.env.PUBLIC_URL || ''}/energybatch.jpg`;

const PROBLEMS = [
  { pre: "Can't stay ", bold: "focused", post: "?" },
  { pre: "Unable to finish your ", bold: "syllabus", post: "?" },
  { pre: "Getting ", bold: "distracted", post: " every day?" },
  { pre: "Not seeing ", bold: "improvement", post: " in mock tests?" },
  { pre: "Struggling with ", bold: "consistency", post: "?" },
  { pre: "", bold: "Falling behind", post: " your study plan?" },
];

const FEATURE_CHIPS = [
  { title: 'Personalized Support', desc: "We've got your back" },
  { title: 'Stay Focused', desc: 'Eliminate distractions and stay productive' },
  { title: 'Stay on Track', desc: 'Consistent improvement every weeks' },
  { title: 'Study Effectively', desc: 'Smart strategies, not just hard work' },
];

const MENTORS = [
  { name: 'Shivakshi Gupta', iit: 'IIT Bombay', year: '2025', img: `${process.env.PUBLIC_URL || ''}/mentors-energybatch/shivakshi1.png` },
  { name: 'Sai Charan', iit: 'IIT Bombay', year: '2023', img: `${process.env.PUBLIC_URL || ''}/mentors-energybatch/saicharan1.png` },
  { name: 'Anant Agrawal', iit: 'IIT Bombay', year: '2024', img: `${process.env.PUBLIC_URL || ''}/mentors-energybatch/anant1.png` },
];

export default function EnergyBatch() {
  return (
    <div className="eb-page">
      <Helmet>
        <title>JEE Mentorship Programs | 1-on-1 IITian Guidance & Daily Schedules — CollegeMap</title>
        <meta name="description" content="Enroll in CollegeMap's structured JEE mentorship programs led by IITians. Get personalized daily study schedules, weekly progress reviews, 24/7 doubt support, and 1-on-1 guidance." />
        <link rel="canonical" href="https://collegemap.in/EnergyBatch" />
      </Helmet>

      <div className="eb-inner">

        {/* ── HERO ── */}
        <header className="eb-hero">
          <div className="eb-hero-grid">

            {/* LEFT */}
            <div className="eb-hero-left">
              <div className="eb-badge">For JEE Aspirants</div>

              <h1 className="eb-new-title">
                Learn <span>Smarter</span><br />
                with Dedicated <span>IITian Mentors.</span><br />
              </h1>

              <p className="eb-new-subtitle">
                Personalized IITian guidance to help you stay disciplined,
                finish your syllabus on time, and improve your JEE performance.
              </p>

              <div className="eb-problem-grid">
                {PROBLEMS.map((p) => (
                  <div className="eb-problem-card" key={p.pre + p.bold + p.post}>
                    <span className="eb-problem-text">
                      {p.pre}
                      <strong>{p.bold}</strong>
                      {p.post}
                    </span>
                  </div>
                ))}
              </div>

              <div className="eb-hero-action-row">
                <span className="eb-ratio-line">Only 5 students per mentor</span>
                <a href={INQUIRE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="eb-primary-btn">
                  Join Energy Batch
                </a>
              </div>
            </div>

            {/* RIGHT */}
            <div className="eb-hero-right">
              <figure className="eb-hero-visual-modern">
                <img
                  src={MENTORSHIP_IMG}
                  alt="Student with IITian mentor"
                  className="eb-hero-img-modern"
                />
              </figure>
            </div>
          </div>
        </header>

        {/* ── MEET OUR MENTORS ── */}

        <section className="eb-mentors" aria-labelledby="eb-mentors-title">
          <div className="eb-mentors-badge">Meet Our Mentors</div>
          <p className="eb-mentors-sub">Learn from IITians who understand your journey.</p>

          <div className="eb-mentor-cards">
            {MENTORS.map(({ name, iit, year, img }) => (
              <div className="eb-mentor-card" key={name}>
                <div className="eb-mentor-img-wrap">
                  <img src={img} alt={name} className="eb-mentor-img" />
                </div>
                <div className="eb-mentor-info">
                  <span className="eb-mentor-name">{name}</span>
                  <span className="eb-mentor-iit-badge">{iit}</span>
                  <span className="eb-mentor-year">Batch of {year}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── OTHER PROGRAMMES ── */}
        <section className="eb-programs" aria-labelledby="eb-programs-title">
          <div className="eb-programs-badge">Other IITian Guidance Programs</div>

          <h2 id="eb-programs-title" className="eb-programs-title">
            Right Guidance Today.<br />
            <span>Better Results</span> Tomorrow.
          </h2>

          <div className="eb-feature-strip">
            {FEATURE_CHIPS.map(({ title, desc }) => (
              <div className="eb-feature-chip" key={title}>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>

          <div className="eb-program-cards">
            <article className="eb-program-card">
              <h3 className="eb-program-card-title">Class 12</h3>
              <p className="eb-program-card-sub">JEE 2027 Aspirants</p>
              <hr className="eb-program-divider" />
              <ul className="eb-program-list">
                <li>Prepare for your <strong>JEE 2027</strong> with <strong>high-focus</strong> peers.</li>
                <li>Guidance for <strong>day-to-day planning</strong>.</li>
                <li><strong>Backlog</strong> cover plans.</li>
                <li><strong>Weekly progress</strong> monitoring.</li>
                <li><strong>24/7 doubt</strong> clearance.</li>
              </ul>
              <a href={INQUIRE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="eb-program-card-btn">
                Join Class 12 Mentorship
              </a>
            </article>

            <article className="eb-program-card">
              <h3 className="eb-program-card-title">Class 11</h3>
              <p className="eb-program-card-sub">JEE 2028 Aspirants</p>
              <hr className="eb-program-divider" />
              <ul className="eb-program-list">
                <li>Prepare for your <strong>JEE 2028</strong> with <strong>high-focus</strong> peers.</li>
                <li>Early guidance to <strong>build discipline</strong>.</li>
                <li>Day-to-day planning to <strong>avoid backlogs</strong>.</li>
                <li><strong>Weekly progress</strong> monitoring.</li>
                <li>Maximum benefit from an <strong>early start</strong>.</li>
              </ul>
              <a href={INQUIRE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="eb-program-card-btn">
                Join Class 11 Mentorship
              </a>
            </article>
          </div>
        </section>

        <p className="eb-footnote">
          Questions?{' '}
          <a href={INQUIRE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Contact us</a>
        </p>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="eb-bottom-nav">
        <div className="eb-bottom-nav-steps">
          <span>Share your goal</span>
          <span className="eb-nav-arrow">→</span>
          <span>Get matched with an IITian</span>
          <span className="eb-nav-arrow">→</span>
          <span>Group Mentorship</span>
        </div>
        <a href={INQUIRE_WHATSAPP_URL} className="eb-start-btn" target="_blank" rel="noopener noreferrer">
          Join now
        </a>
      </div>
    </div>
  );
}