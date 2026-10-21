import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../context/UserProfileContext';
import './CBTPortal.scss';
import { discoverTests, getTestById } from './testDiscovery';
import ProfileIcon from '../../components/ProfileIcon/ProfileIcon';

/**
 * Parse a test id/folder name into structured metadata.
 * Handles formats like:
 *   jee-main-2026-21-jan-shift-1
 *   jee-main-2025-23rd-jan-shift-1
 *   JEE Main 2025 (28 Jan Shift 2)
 */
const parseTestMeta = (id) => {
  let year = '', month = '', date = '', shift = '';

  // Parenthesised format: "JEE Main 2025 (28 Jan Shift 2)"
  const parenMatch = id.match(/(\d{4})\s*\((\d{1,2})\s+(\w+)\s+Shift\s+(\d)\)/i);
  if (parenMatch) {
    year = parenMatch[1];
    date = parenMatch[2];
    month = parenMatch[3].toLowerCase();
    shift = parenMatch[4];
  } else {
    // Slug format: jee-main-2026-21-jan-shift-1  or jee-main-2025-23rd-jan-shift-1
    const slugMatch = id.match(/(\d{4})-(\d{1,2})(?:st|nd|rd|th)?-(\w+)-shift-(\d)/i);
    if (slugMatch) {
      year = slugMatch[1];
      date = slugMatch[2];
      month = slugMatch[3].toLowerCase();
      shift = slugMatch[4];
    } else {
      // Space format: "JEE Main 2024 1st Feb Shift 1" or "JEE Main 2024 27th Jan Shift 2"
      const spaceMatch = id.match(/(\d{4})\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+Shift\s+(\d)/i);
      if (spaceMatch) {
        year = spaceMatch[1];
        date = spaceMatch[2];
        month = spaceMatch[3].toLowerCase();
        shift = spaceMatch[4];
      }
    }
  }

  // Determine session from month (Jan = Session 1, Apr/Jun = Session 2, Feb = Session 1)
  let session = '';
  if (month === 'jan' || month === 'january' || month === 'feb' || month === 'february') session = 'Session 1';
  else if (month === 'apr' || month === 'april') session = 'Session 2';
  else if (month === 'jun' || month === 'june') session = 'Session 2';
  else session = 'Session 1'; // default

  return { year, session, date, shift };
};

const CBTPortal = () => {
  const [tests, setTests] = useState([]);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Filter state for Previous Year Tests
  const [filterYear, setFilterYear] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterShift, setFilterShift] = useState('');

  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { userProfile, refreshProfile } = useUserProfile();

  useEffect(() => {
    const loadProfile = async () => {
      if (!userProfile) {
        const emailStored = sessionStorage.getItem('userEmail');
        if (emailStored) {
          await refreshProfile(emailStored);
        }
      }
    };
    loadProfile();
  }, [userProfile, refreshProfile]);

  useEffect(() => {
    discoverTests()
      .then(discoveredTests => setTests(discoveredTests))
      .catch(error => {
        console.error('Error discovering tests:', error);
        setTests([]);
      });
  }, []);

  // Enrich tests with parsed metadata
  const enrichedTests = useMemo(() =>
    tests.map(t => ({ ...t, meta: parseTestMeta(t.id) })),
    [tests]
  );

  // Derive unique filter options (cascading)
  const availableYears = useMemo(() =>
    [...new Set(enrichedTests.map(t => t.meta.year).filter(Boolean))].sort((a, b) => b - a),
    [enrichedTests]
  );

  const filteredByYear = useMemo(() =>
    filterYear ? enrichedTests.filter(t => t.meta.year === filterYear) : enrichedTests,
    [enrichedTests, filterYear]
  );

  const availableSessions = useMemo(() =>
    [...new Set(filteredByYear.map(t => t.meta.session).filter(Boolean))].sort(),
    [filteredByYear]
  );

  const filteredBySession = useMemo(() =>
    filterSession ? filteredByYear.filter(t => t.meta.session === filterSession) : filteredByYear,
    [filteredByYear, filterSession]
  );

  const availableDates = useMemo(() =>
    [...new Set(filteredBySession.map(t => t.meta.date).filter(Boolean))].sort((a, b) => Number(a) - Number(b)),
    [filteredBySession]
  );

  const filteredByDate = useMemo(() =>
    filterDate ? filteredBySession.filter(t => t.meta.date === filterDate) : filteredBySession,
    [filteredBySession, filterDate]
  );

  const availableShifts = useMemo(() =>
    [...new Set(filteredByDate.map(t => t.meta.shift).filter(Boolean))].sort(),
    [filteredByDate]
  );

  const filteredTests = useMemo(() =>
    filterShift ? filteredByDate.filter(t => t.meta.shift === filterShift) : filteredByDate,
    [filteredByDate, filterShift]
  );

  // Reset downstream filters when upstream changes
  const handleYearChange = (v) => { setFilterYear(v); setFilterSession(''); setFilterDate(''); setFilterShift(''); };
  const handleSessionChange = (v) => { setFilterSession(v); setFilterDate(''); setFilterShift(''); };
  const handleDateChange = (v) => { setFilterDate(v); setFilterShift(''); };
  const handleShiftChange = (v) => { setFilterShift(v); };

  const handleStartTest = (testId) => {
    if (!userProfile) {
      navigate('/login', { state: { testId, redirectTo: '/exams' } });
      return;
    }
    getTestById(testId)
      .then(test => {
        if (test) {
          setSelectedTest(test);
          setShowGuidelines(true);
          setTermsAccepted(false);
        } else {
          console.error('Test not found:', testId);
          navigate('/exams');
        }
      })
      .catch(error => {
        console.error('Error loading test:', error);
        navigate('/exams');
      });
  };

  const handleConfirmStartTest = () => {
    if (!termsAccepted) {
      setShowWarning(true);
      return;
    }
    if (selectedTest) {
      setShowGuidelines(false);
      navigate(`/exams/test/${selectedTest.id}`);
    }
  };

  return (
    <div className="cbt-portal-page">
      <Helmet>
        <title>JEE Mock Tests | Exam Practice with PYQs — CollegeMap</title>
        <meta name="description" content="Attempt JEE Main mock tests in a real JEE Mains environment. Practice previous year papers with a timer, question palette, and instant results. 10,000+ JEE questions curated by IITians." />
        <link rel="canonical" href="https://collegemap.in/exams" />
      </Helmet>
      {/* ─── Header Section ─── */}
      <motion.div
        className="cbt-portal-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-left">
          <h1 className="header-portal-title">Test Portal</h1>
          <p className="header-portal-subtitle">Practice with timed mock tests</p>
        </div>
        <div className="header-right">
          <span className="user-name-label">Name: <strong>{userProfile?.name || 'User'}</strong></span>
          <motion.button
            className="update-details-button"
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Update Details
          </motion.button>
          <motion.button
            className="dashboard-button"
            onClick={() => navigate('/exams/dashboard')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            View Dashboard
          </motion.button>
        </div>
      </motion.div>

      {/* ─── Make-your-own Test Section ─── */}
      <motion.div
        className="custom-test-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="custom-section-title">Make-your-own Test</h2>
        <p className="custom-section-desc">
          Choose your subject, topic, difficulty &amp; number of questions to create a personalized practice test from 10000+ JEE Main and 7500+ special CollgeMap questions
        </p>
        <motion.button
          className="custom-build-btn"
          onClick={() => navigate('/exams/custom')}
          whileHover={{ scale: 1.04, x: 4 }}
          whileTap={{ scale: 0.97 }}
        >
          Build Your Test →
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showGuidelines && (
          <motion.div
            className="guidelines-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!selectedTest) {
                setShowGuidelines(false);
              }
            }}
          >
            <motion.div
              className="guidelines-modal-content nta-official"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="nta-header">
                <h1>GENERAL INSTRUCTIONS</h1>
              </div>

              <div className="nta-content">
                <h2 className="instruction-title">Please read the instructions carefully</h2>

                <div className="instruction-section">
                  <h3 className="section-heading">General Instructions:</h3>

                  <ol className="instruction-list">
                    <li>
                      <span className="instruction-number">1.</span>
                      Total duration of {selectedTest ? selectedTest.title : 'JEE-Main'} is {selectedTest ? selectedTest.duration : '180 min'}.
                    </li>
                    <li>
                      <span className="instruction-number">2.</span>
                      The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.
                    </li>
                    <li>
                      <span className="instruction-number">3.</span>
                      The Questions Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                      <ol className="sub-list">
                        <li>
                          <span className="status-box white-box"></span>
                          <span>You have not visited the question yet.</span>
                        </li>
                        <li>
                          <span className="status-box red-box"></span>
                          <span>You have not answered the question.</span>
                        </li>
                        <li>
                          <span className="status-box green-box"></span>
                          <span>You have answered the question.</span>
                        </li>
                        <li>
                          <span className="status-box purple-box"></span>
                          <span>You have NOT answered the question, but have marked the question for review.</span>
                        </li>
                        <li>
                          <span className="status-box purple-green-box"></span>
                          <span>The question(s) "Answered and Marked for Review" will be considered for evaluation.</span>
                        </li>
                      </ol>
                    </li>
                    <li>
                      <span className="instruction-number">4.</span>
                      You can click on your "Profile" image on top right corner of your screen to change the language during the exam for entire question paper. On clicking of Profile image you will get a drop-down to change the question content to the desired language.
                    </li>
                    <li>
                      <span className="instruction-number">5.</span>
                      You can click on <span className="arrow-icon down-arrow"></span> to navigate to the bottom and <span className="arrow-icon up-arrow"></span> to navigate to top of the question are, without scrolling.
                    </li>
                  </ol>
                </div>

                <div className="instruction-section">
                  <h3 className="section-heading">Navigating to a Question:</h3>

                  <ol className="instruction-list" start="6">
                    <li>
                      <span className="instruction-number">6.</span>
                      To answer a question, do the following:
                      <ol className="sub-list alpha-list">
                        <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                        <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
                        <li>Click on <strong>Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                      </ol>
                    </li>
                  </ol>
                </div>

                <div className="instruction-section">
                  <h3 className="section-heading">Answering a Question:</h3>

                  <ol className="instruction-list" start="7">
                    <li>
                      <span className="instruction-number">7.</span>
                      Procedure for answering a multiple choice type question:
                      <ol className="sub-list alpha-list">
                        <li>To select you answer, click on the button of one of the options.</li>
                        <li>To deselect your chosen answer, click on the button of the chosen option again or click on the <strong>Clear Response</strong> button</li>
                        <li>To change your chosen answer, click on the button of another option</li>
                        <li>To save your answer, you MUST click on the Save & Next button.</li>
                        <li>To mark the question for review, click on the Mark for Review & Next button.</li>
                      </ol>
                    </li>
                    <li>
                      <span className="instruction-number">8.</span>
                      To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.
                    </li>
                  </ol>
                </div>

                <div className="instruction-section">
                  <h3 className="section-heading">Navigating through sections:</h3>

                  <ol className="instruction-list" start="9">
                    <li>
                      <span className="instruction-number">9.</span>
                      Sections in this question paper are displayed on the top bar of the screen. Questions in a section can be viewed by click on the section name. The section you are currently viewing is highlighted.
                    </li>
                    <li>
                      <span className="instruction-number">10.</span>
                      After click the Save & Next button on the last question for a section, you will automatically be taken to the first question of the next section.
                    </li>
                    <li>
                      <span className="instruction-number">11.</span>
                      You can shuffle between sections and questions anything during the examination as per your convenience only during the time stipulated.
                    </li>
                    <li>
                      <span className="instruction-number">12.</span>
                      Candidate can view the corresponding section summary as part of the legend that appears in every section above the question palette.
                    </li>
                  </ol>
                </div>

                <p className="note-text">
                  Please note all questions will appear in your default language. This language can be changed for a particular question later on.
                </p>

                <div className="declaration-box">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      id="terms-checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span className="declaration-text">
                      I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall.I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations
                    </span>
                  </label>
                </div>

                <div className="proceed-button-container">
                  <button
                    className="proceed-btn"
                    onClick={handleConfirmStartTest}
                  >
                    PROCEED
                  </button>
                </div>

                <div className="nta-footer">
                  © All Rights Reserved - National Testing Agency
                </div>
              </div>
            </motion.div>

            {/* Warning Modal */}
            <AnimatePresence>
              {showWarning && (
                <motion.div
                  className="warning-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowWarning(false)}
                >
                  <motion.div
                    className="warning-modal"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="warning-icon">⚠</div>
                    <h3>Warning!</h3>
                    <p>Please accept terms and conditions before proceeding.</p>
                    <button
                      className="ok-btn"
                      onClick={() => setShowWarning(false)}
                    >
                      OK
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Previous Year Tests Section ─── */}
      <motion.div
        className="pyt-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="pyt-header">
          <div className="pyt-title-wrapper">
            <h2>JEE Mains Previous Year Tests</h2>
            <p className="pyt-subtitle">Experience the actual exam environment with official past papers</p>
          </div>
        </div>

        <div className="pyt-filters">
          {/* Year */}
          <div className="filter-dropdown">
            <select value={filterYear} onChange={e => handleYearChange(e.target.value)}>
              <option value="">YEAR</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="dropdown-arrow">▼</span>
          </div>

          {/* Session */}
          <div className="filter-dropdown">
            <select value={filterSession} onChange={e => handleSessionChange(e.target.value)} disabled={!filterYear}>
              <option value="">Session</option>
              {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="dropdown-arrow">▼</span>
          </div>

          {/* Date */}
          <div className="filter-dropdown">
            <select value={filterDate} onChange={e => handleDateChange(e.target.value)} disabled={!filterSession}>
              <option value="">Date</option>
              {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="dropdown-arrow">▼</span>
          </div>

          {/* Shift */}
          <div className="filter-dropdown">
            <select value={filterShift} onChange={e => handleShiftChange(e.target.value)} disabled={!filterDate}>
              <option value="">Shift</option>
              {availableShifts.map(s => <option key={s} value={s}>Shift {s}</option>)}
            </select>
            <span className="dropdown-arrow">▼</span>
          </div>
        </div>

        {/* Filtered test results */}
        <AnimatePresence>
          {filterYear && filteredTests.length > 0 && (
            <motion.div
              className="pyt-results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {filteredTests.map(test => (
                <motion.div className="pyt-test-card" key={test.id} whileHover={{ scale: 1.01 }}>
                  <div className="pyt-test-info">
                    <h4>{test.title}</h4>
                    <span className="pyt-meta">{test.duration} &middot; {test.totalQuestions} Questions</span>
                  </div>
                  <button className="pyt-start-btn" onClick={() => handleStartTest(test.id)}>
                    Start Test
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
          {filterYear && filteredTests.length === 0 && (
            <motion.p className="pyt-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              No tests match the selected filters.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CBTPortal;

