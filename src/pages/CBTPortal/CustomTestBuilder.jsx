import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../../context/UserProfileContext';
import './CustomTestBuilder.scss';
import { buildQuestionPool, filterQuestions, getAvailableCounts, generateCustomTest } from './customTestGenerator';
import ProfileIcon from '../../components/ProfileIcon/ProfileIcon';

const CustomTestBuilder = () => {
  const navigate = useNavigate();
  const { userProfile, refreshProfile } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionPool, setQuestionPool] = useState([]);
  const [lessonsBySubject, setLessonsBySubject] = useState({});
  const [totalTestsLoaded, setTotalTestsLoaded] = useState(0);
  const [totalChaptersLoaded, setTotalChaptersLoaded] = useState(0);

  // Filter state
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [questionCount, setQuestionCount] = useState(25);
  const [questionType, setQuestionType] = useState('all'); // 'all', 'mcq', 'numerical'

  // UI state
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [lessonSearch, setLessonSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [generatedTestId, setGeneratedTestId] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Load question pool on mount
  useEffect(() => {
    if (!userProfile) {
      const emailStored = sessionStorage.getItem('userEmail');
      if (!emailStored) {
        navigate('/login', { state: { redirectTo: '/exams/custom' } });
        return;
      }
      // Load profile from context
      refreshProfile(emailStored);
      return;
    }

    setLoading(true);
    buildQuestionPool()
      .then(pool => {
        setQuestionPool(pool.questions);
        setLessonsBySubject(pool.lessonsBySubject);
        setTotalTestsLoaded(pool.totalTests);
        setTotalChaptersLoaded(pool.totalChapters || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error building question pool:', err);
        setError('Failed to load question bank. Please try again.');
        setLoading(false);
      });
  }, [navigate]);

  // Current filters object
  const currentFilters = useMemo(() => ({
    subjects: selectedSubjects,
    lessons: selectedLessons,
    difficulties: selectedDifficulties,
    questionType
  }), [selectedSubjects, selectedLessons, selectedDifficulties, questionType]);

  // Filtered questions and counts
  const filteredQuestions = useMemo(() =>
    filterQuestions(questionPool, currentFilters),
    [questionPool, currentFilters]
  );

  const availableCounts = useMemo(() =>
    getAvailableCounts(questionPool, currentFilters),
    [questionPool, currentFilters]
  );

  // Available lessons based on selected subjects
  const availableLessons = useMemo(() => {
    if (selectedSubjects.length === 0) {
      return Object.values(lessonsBySubject).flat();
    }
    return selectedSubjects.flatMap(s => lessonsBySubject[s] || []);
  }, [selectedSubjects, lessonsBySubject]);

  // Unique sorted available lessons
  const uniqueAvailableLessons = useMemo(() => {
    return [...new Set(availableLessons)].sort();
  }, [availableLessons]);

  // Filtered lessons for search
  const filteredLessons = useMemo(() => {
    if (!lessonSearch.trim()) return uniqueAvailableLessons;
    const search = lessonSearch.toLowerCase();
    return uniqueAvailableLessons.filter(l => l.toLowerCase().includes(search));
  }, [uniqueAvailableLessons, lessonSearch]);

  // Auto-adjust question count when pool size changes
  useEffect(() => {
    if (filteredQuestions.length > 0 && questionCount > filteredQuestions.length) {
      setQuestionCount(Math.min(questionCount, filteredQuestions.length));
    }
  }, [filteredQuestions.length, questionCount]);

  // Handlers
  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => {
      const next = prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject];
      // Clear lessons that aren't available in new subject selection
      if (next.length > 0) {
        const newAvailableLessons = next.flatMap(s => lessonsBySubject[s] || []);
        setSelectedLessons(prev => prev.filter(l => newAvailableLessons.includes(l)));
      }
      return next;
    });
  };

  const toggleDifficulty = (diff) => {
    setSelectedDifficulties(prev =>
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

  const toggleLesson = (lesson) => {
    setSelectedLessons(prev =>
      prev.includes(lesson) ? prev.filter(l => l !== lesson) : [...prev, lesson]
    );
  };

  const selectAllLessons = () => {
    setSelectedLessons([...uniqueAvailableLessons]);
  };

  const clearAllLessons = () => {
    setSelectedLessons([]);
  };

  const handleGenerate = () => {
    if (filteredQuestions.length === 0) return;

    setGenerating(true);

    try {
      const config = {
        subjects: selectedSubjects,
        lessons: selectedLessons,
        difficulties: selectedDifficulties,
        questionType,
        questionCount
      };

      const testData = generateCustomTest(filteredQuestions, questionCount, config);
      setGeneratedTestId(testData.paperId);
      setShowGuidelines(true);
      setTermsAccepted(false);
    } catch (err) {
      console.error('Error generating test:', err);
      setError('Failed to generate test. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmStartTest = () => {
    if (!termsAccepted) {
      setShowWarning(true);
      return;
    }
    if (generatedTestId) {
      setShowGuidelines(false);
      navigate(`/exams/test/${generatedTestId}`);
    }
  };

  // Subject configs
  const subjects = [
    { id: 'physics', label: 'Physics', icon: '⚛️', color: '#4CAF50' },
    { id: 'chemistry', label: 'Chemistry', icon: '🧪', color: '#FF9800' },
    { id: 'mathematics', label: 'Mathematics', icon: '📐', color: '#2196F3' }
  ];

  const difficulties = [
    { id: 'easy', label: 'Easy', icon: '🟢', color: '#4CAF50' },
    { id: 'medium', label: 'Medium', icon: '🟡', color: '#FF9800' },
    { id: 'hard', label: 'Hard', icon: '🔴', color: '#f44336' }
  ];

  if (loading) {
    return (
      <div className="custom-test-builder">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="custom-test-builder">
        <div className="error-container">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-test-builder">
      {/* Header */}
      <motion.div
        className="builder-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-nav">
          <button className="back-button" onClick={() => navigate('/exams')}>
            ← Back to CBT Portal
          </button>
        </div>
        <h1>📝 Custom Test Builder</h1>
        <p className="subtitle">
          Build your own practice test from <strong>{questionPool.length}</strong> questions
          across <strong>{totalTestsLoaded}</strong> JEE Main papers
          {totalChaptersLoaded > 0 && <> + <strong>{totalChaptersLoaded}</strong> chapter-wise question banks</>}
        </p>
      </motion.div>

      <div className="builder-content">
        {/* Left Panel - Filters */}
        <motion.div
          className="filters-panel"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Step 1: Subject Selection */}
          <div className="filter-section">
            <h3 className="section-title">
              <span className="step-number">1</span>
              Select Subject(s)
            </h3>
            <p className="section-hint">Leave empty for all subjects</p>
            <div className="subject-chips">
              {subjects.map(subject => (
                <motion.button
                  key={subject.id}
                  className={`chip subject-chip ${selectedSubjects.includes(subject.id) ? 'active' : ''}`}
                  onClick={() => toggleSubject(subject.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={selectedSubjects.includes(subject.id)
                    ? { borderColor: subject.color, backgroundColor: `${subject.color}15` }
                    : {}
                  }
                >
                  <span className="chip-icon">{subject.icon}</span>
                  <span className="chip-label">{subject.label}</span>
                  {availableCounts.bySubject[subject.id] !== undefined && (
                    <span className="chip-count">{availableCounts.bySubject[subject.id] || 0}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Step 2: Difficulty Selection */}
          <div className="filter-section">
            <h3 className="section-title">
              <span className="step-number">2</span>
              Select Difficulty
            </h3>
            <p className="section-hint">Leave empty for all difficulty levels</p>
            <div className="difficulty-chips">
              {difficulties.map(diff => (
                <motion.button
                  key={diff.id}
                  className={`chip difficulty-chip ${selectedDifficulties.includes(diff.id) ? 'active' : ''}`}
                  onClick={() => toggleDifficulty(diff.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={selectedDifficulties.includes(diff.id)
                    ? { borderColor: diff.color, backgroundColor: `${diff.color}15` }
                    : {}
                  }
                >
                  <span className="chip-icon">{diff.icon}</span>
                  <span className="chip-label">{diff.label}</span>
                  <span className="chip-count">{availableCounts.byDifficulty[diff.id] || 0}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Step 3: Lesson/Topic Selection */}
          <div className="filter-section">
            <h3 className="section-title">
              <span className="step-number">3</span>
              Select Topics
            </h3>
            <p className="section-hint">
              {selectedLessons.length === 0
                ? 'Leave empty for all topics'
                : `${selectedLessons.length} topic${selectedLessons.length > 1 ? 's' : ''} selected`
              }
            </p>

            <button
              className="topic-picker-button"
              onClick={() => setShowLessonPicker(!showLessonPicker)}
            >
              {showLessonPicker ? '▲ Hide Topics' : '▼ Choose Topics'}
              ({uniqueAvailableLessons.length} available)
            </button>

            <AnimatePresence>
              {showLessonPicker && (
                <motion.div
                  className="lesson-picker"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="lesson-search">
                    <input
                      type="text"
                      placeholder="Search topics..."
                      value={lessonSearch}
                      onChange={(e) => setLessonSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <div className="lesson-actions">
                    <button className="action-btn" onClick={selectAllLessons}>Select All</button>
                    <button className="action-btn" onClick={clearAllLessons}>Clear All</button>
                  </div>
                  <div className="lesson-list">
                    {filteredLessons.map(lesson => (
                      <label key={lesson} className="lesson-item">
                        <input
                          type="checkbox"
                          checked={selectedLessons.includes(lesson)}
                          onChange={() => toggleLesson(lesson)}
                        />
                        <span className="lesson-name">{lesson}</span>
                        <span className="lesson-count">
                          {availableCounts.byLesson[lesson] || 0}
                        </span>
                      </label>
                    ))}
                    {filteredLessons.length === 0 && (
                      <p className="no-lessons">No matching topics found</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected lessons tags */}
            {selectedLessons.length > 0 && (
              <div className="selected-lessons-tags">
                {selectedLessons.map(lesson => (
                  <span key={lesson} className="lesson-tag">
                    {lesson}
                    <button onClick={() => toggleLesson(lesson)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Step 4: Question Type */}
          <div className="filter-section">
            <h3 className="section-title">
              <span className="step-number">4</span>
              Question Type
            </h3>
            <div className="type-selector">
              {[
                { id: 'all', label: 'All Types' },
                { id: 'mcq', label: 'MCQ Only' },
                { id: 'numerical', label: 'Numerical Only' }
              ].map(type => (
                <button
                  key={type.id}
                  className={`type-btn ${questionType === type.id ? 'active' : ''}`}
                  onClick={() => setQuestionType(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 5: Number of Questions */}
          <div className="filter-section">
            <h3 className="section-title">
              <span className="step-number">5</span>
              Number of Questions
            </h3>
            <div className="question-count-control">
              <input
                type="range"
                min={1}
                max={Math.min(filteredQuestions.length, 90)}
                value={Math.min(questionCount, filteredQuestions.length || 1)}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="question-slider"
                disabled={filteredQuestions.length === 0}
              />
              <div className="count-display">
                <input
                  type="number"
                  min={1}
                  max={Math.min(filteredQuestions.length, 90)}
                  value={Math.min(questionCount, filteredQuestions.length || 1)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuestionCount(Math.min(Math.max(1, val), filteredQuestions.length || 1));
                  }}
                  className="count-input"
                  disabled={filteredQuestions.length === 0}
                />
                <span className="count-max">/ {filteredQuestions.length} available</span>
              </div>
            </div>
            {/* Quick presets */}
            <div className="count-presets">
              {[10, 15, 25, 30, 45, 75].map(count => (
                count <= filteredQuestions.length && (
                  <button
                    key={count}
                    className={`preset-btn ${questionCount === count ? 'active' : ''}`}
                    onClick={() => setQuestionCount(count)}
                  >
                    {count}
                  </button>
                )
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Preview & Generate */}
        <motion.div
          className="preview-panel"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="preview-card">
            <h3>Test Preview</h3>

            <div className="preview-stats">
              <div className="stat-item">
                <span className="stat-value">{Math.min(questionCount, filteredQuestions.length)}</span>
                <span className="stat-label">Questions</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {Math.min(
                    Math.ceil(Math.min(questionCount, filteredQuestions.length) * 3),
                    180
                  )}
                </span>
                <span className="stat-label">Minutes</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{Math.min(questionCount, filteredQuestions.length) * 4}</span>
                <span className="stat-label">Max Marks</span>
              </div>
            </div>

            {/* Subject breakdown */}
            {filteredQuestions.length > 0 && (
              <div className="preview-breakdown">
                <h4>Subject Distribution</h4>
                {Object.entries(availableCounts.bySubject).map(([subject, count]) => (
                  <div key={subject} className="breakdown-row">
                    <span className="breakdown-label">
                      {subject === 'mathematics' ? 'Mathematics' :
                        subject.charAt(0).toUpperCase() + subject.slice(1)}
                    </span>
                    <div className="breakdown-bar">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(count / filteredQuestions.length) * 100}%`,
                          backgroundColor: subject === 'physics' ? '#4CAF50' :
                            subject === 'chemistry' ? '#FF9800' : '#2196F3'
                        }}
                      />
                    </div>
                    <span className="breakdown-count">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Difficulty breakdown */}
            {filteredQuestions.length > 0 && (
              <div className="preview-breakdown">
                <h4>Difficulty Distribution</h4>
                {Object.entries(availableCounts.byDifficulty)
                  .filter(([, count]) => count > 0)
                  .map(([diff, count]) => (
                    <div key={diff} className="breakdown-row">
                      <span className="breakdown-label">
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </span>
                      <div className="breakdown-bar">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(count / filteredQuestions.length) * 100}%`,
                            backgroundColor: diff === 'easy' ? '#4CAF50' :
                              diff === 'medium' ? '#FF9800' : '#f44336'
                          }}
                        />
                      </div>
                      <span className="breakdown-count">{count}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Practice mode notice */}
            <div className="practice-notice">
              <span className="notice-icon">ℹ️</span>
              <p>
                Questions sourced from JEE Main papers. Some questions may be in
                <strong> practice mode</strong> (no auto-scoring) if answer keys are unavailable.
              </p>
            </div>

            {/* Generate button */}
            <motion.button
              className={`generate-button ${filteredQuestions.length === 0 ? 'disabled' : ''}`}
              onClick={handleGenerate}
              disabled={filteredQuestions.length === 0 || generating}
              whileHover={filteredQuestions.length > 0 ? { scale: 1.02 } : {}}
              whileTap={filteredQuestions.length > 0 ? { scale: 0.98 } : {}}
            >
              {generating ? (
                <>
                  <span className="btn-spinner"></span>
                  Generating...
                </>
              ) : filteredQuestions.length === 0 ? (
                'No questions match your filters'
              ) : (
                `🚀 Generate & Start Test (${Math.min(questionCount, filteredQuestions.length)} Questions)`
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Guidelines Modal - same as CBTPortal */}
      <AnimatePresence>
        {showGuidelines && (
          <motion.div
            className="guidelines-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                    <li><span className="instruction-number">1.</span> This is a custom practice test. The timer will be set based on your selected question count.</li>
                    <li><span className="instruction-number">2.</span> The countdown timer in the top right corner will display remaining time. When the timer reaches zero, the test will auto-submit.</li>
                    <li>
                      <span className="instruction-number">3.</span> Question status colors:
                      <ol className="sub-list">
                        <li><span className="status-box white-box"></span><span>Not visited</span></li>
                        <li><span className="status-box red-box"></span><span>Not answered</span></li>
                        <li><span className="status-box green-box"></span><span>Answered</span></li>
                        <li><span className="status-box purple-box"></span><span>Marked for review (not answered)</span></li>
                        <li><span className="status-box purple-green-box"></span><span>Answered and marked for review (will be evaluated)</span></li>
                      </ol>
                    </li>
                    <li><span className="instruction-number">4.</span> Click <strong>Save & Next</strong> to save and proceed. Click <strong>Clear Response</strong> to deselect.</li>
                    <li><span className="instruction-number">5.</span> MCQ: +4 for correct, -1 for wrong. Numerical: +4 for correct, -1 for wrong.</li>
                  </ol>
                </div>

                <div className="declaration-box">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span className="declaration-text">
                      I have read and understood the instructions. I am ready to begin the test.
                    </span>
                  </label>
                </div>

                <div className="proceed-button-container">
                  <button className="proceed-btn" onClick={handleConfirmStartTest}>PROCEED</button>
                  <button
                    className="cancel-btn"
                    onClick={() => { setShowGuidelines(false); setGeneratedTestId(null); }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {showWarning && (
                <motion.div className="warning-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWarning(false)}>
                  <motion.div className="warning-modal" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                    <div className="warning-icon">⚠</div>
                    <h3>Warning!</h3>
                    <p>Please accept terms before proceeding.</p>
                    <button className="ok-btn" onClick={() => setShowWarning(false)}>OK</button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Used for loading display
const TEST_REGISTRY_COUNT = 10;

export default CustomTestBuilder;
