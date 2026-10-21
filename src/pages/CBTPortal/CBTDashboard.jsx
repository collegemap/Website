import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import './CBTDashboard.scss';
import ProfileIcon from '../../components/ProfileIcon/ProfileIcon';
import { downloadTestAnalysisPDF } from './pdfGenerator';
import { loadImageBasedTest, resolveImageUrl } from './testLoader';
import { getTestResults } from '../../services/supabaseService';

const CBTDashboard = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showQuestionBreakdown, setShowQuestionBreakdown] = useState(false);
  const [breakdownTestData, setBreakdownTestData] = useState(null);
  const [resolvedImageUrls, setResolvedImageUrls] = useState({});
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { userProfile, refreshProfile } = useUserProfile();

  useEffect(() => {
    // Check profile and load if needed
    const loadAndFetch = async () => {
      if (!userProfile) {
        const emailStored = sessionStorage.getItem('userEmail');
        if (!emailStored) {
          navigate('/login', { state: { redirectTo: '/exams/dashboard' } });
          return;
        }
        // Fetch profile from Supabase
        await refreshProfile(emailStored);
      }
      // Profile exists, fetch test history
      fetchTestHistory();
    };
    
    loadAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTestHistory = async () => {
    try {
      setLoading(true);
      if (!userProfile?.email) {
        console.warn('⚠️ [DASHBOARD] No user profile found');
        setTestHistory([]);
        setLoading(false);
        return;
      }

      const userEmail = userProfile.email;

      if (!userEmail) {
        console.warn('⚠️ [DASHBOARD] No email in user profile');
        setTestHistory([]);
        setLoading(false);
        return;
      }

      console.log('📊 [DASHBOARD] Fetching test history for:', userEmail);

      // Fetch from Supabase
      const results = await getTestResults(userEmail);
      
      console.log(`✅ [DASHBOARD] Fetched ${results.length} results from Supabase`);
      
      // Sort by date (most recent first)
      const sortedResults = sortTestsByDate(results);
      
      setTestHistory(sortedResults);
    } catch (error) {
      console.error('❌ [DASHBOARD] Error fetching test history:', error);
      setTestHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Helper function to sort tests by date (most recent first)
  const sortTestsByDate = (tests) => {
    return [...tests].sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA; // Most recent first
    });
  };

  const getPerformanceColor = (percentage) => {
    const percent = parseFloat(percentage) || 0;
    if (percent >= 75) return '#10c3bc';
    if (percent >= 50) return '#ffa500';
    return '#ff4444';
  };

  const handleDownloadReport = async (test) => {
    try {
      console.log('📄 Generating PDF report for:', test.testTitle);
      
      // Show loading message
      const loadingMsg = document.createElement('div');
      loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#10c3bc;color:white;padding:20px 40px;border-radius:10px;z-index:99999;font-size:18px;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
      loadingMsg.textContent = '📄 Generating PDF... Please wait...';
      document.body.appendChild(loadingMsg);

      try {
        // Load test data
        const testData = await loadImageBasedTest(test.testId);
        
        // Reconstruct results object from stored test data
        const results = {
          totalMarks: test.totalMarks || 0,
          totalQuestions: test.totalQuestions || 0,
          correctAnswers: test.correctAnswers || 0,
          incorrectAnswers: test.incorrectAnswers || 0,
          unattempted: test.unattempted || 0,
          percentage: test.percentage || '0',
          totalTestDuration: test.totalTestDuration || 0,
          sectionWiseResults: test.sectionWiseResults || {},
          questionDetails: test.questionDetails || [], // May not be available
          fullscreenExitCount: test.fullscreenExitCount || 0
        };

        // Resolve image URLs for questions
        const imageUrls = {};
        if (results.questionDetails && results.questionDetails.length > 0) {
          for (const question of results.questionDetails) {
            if (question.questionImage) {
              try {
                const resolvedUrl = await resolveImageUrl(question.questionImage);
                if (resolvedUrl) {
                  imageUrls[question.questionId] = resolvedUrl;
                }
              } catch (error) {
                console.warn('Failed to resolve image for question:', question.questionId);
              }
            }
          }
        }
        
        // Generate and download PDF
        await downloadTestAnalysisPDF(results, testData, imageUrls, userProfile);
        
        // Remove loading message
        document.body.removeChild(loadingMsg);
        console.log('✅ PDF downloaded successfully');
      } catch (error) {
        // Remove loading message
        if (document.body.contains(loadingMsg)) {
          document.body.removeChild(loadingMsg);
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert('Failed to download PDF. The test data may not be fully available. Please try again or contact support.');
    }
  };

  if (loading) {
    return (
      <div className="cbt-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your test history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cbt-dashboard">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <h1>My Test Dashboard</h1>
          <p>Welcome, {userProfile?.name || 'Student'}</p>
        </div>
        <div className="header-actions">
          <button
            className="back-button"
            onClick={() => navigate('/exams')}
          >
            ← Back to Portal
          </button>
        </div>
      </motion.div>

      {testHistory.length === 0 ? (
        <motion.div
          className="no-tests-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>No Tests Taken Yet</h2>
            <p>Start taking tests to see your results and analysis here</p>
            <button
              className="start-test-button"
              onClick={() => navigate('/exams')}
            >
              Take Your First Test
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div
            className="stats-summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-card">
              <h3>Total Tests</h3>
              <p className="stat-number">{testHistory.length}</p>
            </div>
            <div className="stat-card">
              <h3>Average Score</h3>
              <p className="stat-number">
                {testHistory.length > 0
                  ? Math.round(
                      testHistory.reduce((sum, test) => {
                        const percentage = parseFloat(test.percentage || 0);
                        return sum + percentage;
                      }, 0) / testHistory.length
                    )
                  : 0}%
              </p>
            </div>
            <div className="stat-card">
              <h3>Best Score</h3>
              <p className="stat-number">
                {testHistory.length > 0
                  ? Math.max(...testHistory.map((test) => parseFloat(test.percentage || 0)).filter(p => !isNaN(p)))
                  : 0}%
              </p>
            </div>
          </motion.div>

          <motion.div
            className="test-history-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2>Test History</h2>
            <div className="tests-grid">
              {testHistory.map((test, index) => (
                <motion.div
                  key={test.id || index}
                  className="test-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="test-card-header">
                    <h3>{test?.testTitle || 'Test'}</h3>
                    <span className="test-date">{formatDate(test?.completedAt)}</span>
                  </div>
                  <div className="test-card-body">
                    <div className="score-display">
                      <div className="score-circle">
                        <svg className="score-svg" viewBox="0 0 100 100">
                          <circle
                            className="score-circle-bg"
                            cx="50"
                            cy="50"
                            r="45"
                          />
                          <circle
                            className="score-circle-progress"
                            cx="50"
                            cy="50"
                            r="45"
                            style={{
                              strokeDasharray: `${2 * Math.PI * 45}`,
                              strokeDashoffset: `${2 * Math.PI * 45 * (1 - Math.min(Math.max((test?.percentage || 0) / 100, 0), 1))}`,
                              stroke: getPerformanceColor(test?.percentage || 0)
                            }}
                          />
                        </svg>
                        <div className="score-text">
                          <span className="score-percentage">{Math.round(test?.percentage || 0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="test-stats">
                      <div className="stat-row">
                        <span className="stat-label">Marks:</span>
                        <span className="stat-value">{test?.totalMarks || 0} / {(test?.totalQuestions || 0) * 4}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Correct:</span>
                        <span className="stat-value correct">{test?.correctAnswers || 0}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Incorrect:</span>
                        <span className="stat-value incorrect">{test?.incorrectAnswers || 0}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Unattempted:</span>
                        <span className="stat-value unattempted">{test?.unattempted || 0}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Time Taken:</span>
                        <span className="stat-value">{formatTime(test?.totalTestDuration || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="test-card-footer">
                    <button
                      className="view-analysis-button"
                      onClick={() => {
                        setSelectedTest(test);
                        setShowAnalysis(true);
                      }}
                    >
                      📊 View Analysis
                    </button>
                    <button
                      className="view-breakdown-button"
                      onClick={async () => {
                        try {
                          // Show loading
                          const loadingMsg = document.createElement('div');
                          loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#8b5cf6;color:white;padding:20px 40px;border-radius:10px;z-index:99999;font-size:18px;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
                          loadingMsg.textContent = '📋 Loading question breakdown...';
                          document.body.appendChild(loadingMsg);

                          // Load test data for question breakdown
                          const testData = await loadImageBasedTest(test.testId);
                          
                          // Merge questionDetails from stored results with actual test data
                          const enrichedQuestionDetails = [];
                          if (test.questionDetails && test.questionDetails.length > 0 && testData) {
                            for (const storedQuestion of test.questionDetails) {
                              // Find matching question in testData
                              let actualQuestion = null;
                              for (const section of testData.sections || []) {
                                actualQuestion = (section.questions || []).find(
                                  q => q.questionId === storedQuestion.questionId || 
                                       (q.questionNumber === storedQuestion.questionNumber && 
                                        section.sectionId === storedQuestion.sectionId)
                                );
                                if (actualQuestion) break;
                              }

                              // Merge stored data with actual question data
                              const mergedQuestion = {
                                ...storedQuestion,
                                questionText: actualQuestion?.questionText || storedQuestion.questionText || 'Question text not available',
                                questionImage: actualQuestion?.questionImage || storedQuestion.questionImage,
                                options: actualQuestion?.options || storedQuestion.options || [],
                                questionType: actualQuestion?.questionType || storedQuestion.questionType
                              };
                              
                              // For integer questions, ensure correctAnswer is set from correctIntegerAnswer if missing
                              if (mergedQuestion.questionType === 'integer' && !mergedQuestion.correctAnswer && actualQuestion?.correctIntegerAnswer) {
                                mergedQuestion.correctAnswer = actualQuestion.correctIntegerAnswer.toString();
                              }
                              
                              enrichedQuestionDetails.push(mergedQuestion);
                            }
                          }

                          // Update test with enriched question details
                          const enrichedTest = {
                            ...test,
                            questionDetails: enrichedQuestionDetails.length > 0 ? enrichedQuestionDetails : test.questionDetails
                          };
                          
                          setBreakdownTestData(testData);
                          setSelectedTest(enrichedTest);
                          
                          // Resolve image URLs with retry logic
                          const resolved = {};
                          if (enrichedTest.questionDetails && enrichedTest.questionDetails.length > 0) {
                            for (const question of enrichedTest.questionDetails) {
                              if (question.questionImage) {
                                try {
                                  // Try resolveImageUrl first
                                  let url = await resolveImageUrl(question.questionImage);
                                  
                                  // If that fails, try extensions
                                    const basePath = question.questionImage.replace(/\.(png|jpe?g)$/i, '');
                                    const extensions = ['.png', '.jpg', '.jpeg'];
                                    for (const ext of extensions) {
                                      const testUrl = `${basePath}${ext}`;
                                      try {
                                        const response = await fetch(testUrl, { method: 'GET' });
                                        if (response.ok) {
                                          url = testUrl;
                                          break;
                                        }
                                      } catch (e) {
                                        // Continue to next extension
                                      }
                                    }
                                  
                                  if (url) {
                                    resolved[question.questionId] = url;
                                  }
                                } catch (e) {
                                  console.warn('Failed to resolve image:', question.questionId, e);
                                }
                              }
                            }
                          }
                          
                          setResolvedImageUrls(resolved);
                          setShowQuestionBreakdown(true);
                          
                          // Remove loading message
                          if (document.body.contains(loadingMsg)) {
                            document.body.removeChild(loadingMsg);
                          }
                        } catch (error) {
                          console.error('Error loading test data:', error);
                          // Remove loading message if exists
                          const loadingMsg = document.querySelector('div[style*="z-index:99999"]');
                          if (loadingMsg) document.body.removeChild(loadingMsg);
                          
                          alert('Failed to load test data for breakdown. Some details may not be available.');
                          setSelectedTest(test);
                          setShowQuestionBreakdown(true);
                        }
                      }}
                    >
                      📋 Question Breakdown
                    </button>
                    <button
                      className="download-report-button"
                      onClick={async () => {
                        await handleDownloadReport(test);
                      }}
                    >
                      📥 Download PDF
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Question Breakdown Modal */}
      <AnimatePresence>
        {showQuestionBreakdown && selectedTest && (
          <motion.div
            className="breakdown-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuestionBreakdown(false)}
          >
            <motion.div
              className="breakdown-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="breakdown-header">
                <h2>Question Breakdown - {selectedTest?.testTitle || 'Test'}</h2>
                <button
                  className="close-button"
                  onClick={() => setShowQuestionBreakdown(false)}
                >
                  ✕
                </button>
              </div>
              <div className="breakdown-content">
                {selectedTest?.questionDetails && selectedTest.questionDetails.length > 0 ? (
                  selectedTest.questionDetails.map((question, index) => (
                    <div key={question.questionId || index} className="breakdown-question-item">
                      <div className="question-header-breakdown">
                        <span className="section-badge">{question.sectionName || 'Section'}</span>
                        <span className="question-number-badge">Q{question.questionNumber}</span>
                        <span className={`status-badge ${question.isCorrect ? 'correct' : question.userAnswer !== 'Not Attempted' ? 'incorrect' : 'unattempted'}`}>
                          {question.isCorrect ? '✓ Correct' : question.userAnswer !== 'Not Attempted' ? '✗ Incorrect' : '○ Unattempted'}
                        </span>
                        <span className="time-badge">⏱️ {formatTime(question.timeSpent || 0)}</span>
                      </div>

                      {question.questionImage && (
                        <div className="question-image-container">
                          <img 
                            src={resolvedImageUrls[question.questionId] || 
                                 (question.questionImage.match(/\.(png|jpe?g)$/i) ? question.questionImage : `${question.questionImage}.png`)} 
                            alt={`Question ${question.questionNumber}`} 
                            className="question-image"
                            onError={(e) => {
                              // Try different extensions if current fails
                              const basePath = question.questionImage.replace(/\.(png|jpe?g)$/i, '');
                              const extensions = ['.png', '.jpg', '.jpeg'];
                              const currentSrc = e.target.src;
                              
                              // Find which extension we tried
                              let currentExtIndex = -1;
                              for (let i = 0; i < extensions.length; i++) {
                                if (currentSrc.includes(extensions[i])) {
                                  currentExtIndex = i;
                                  break;
                                }
                              }
                              
                              // Try next extension
                              if (currentExtIndex !== -1 && currentExtIndex < extensions.length - 1) {
                                const nextExt = extensions[currentExtIndex + 1];
                                e.target.src = `${basePath}${nextExt}`;
                                console.log(`🔄 Trying ${nextExt} for Q${question.questionNumber}`);
                              } else if (currentExtIndex === -1 && !currentSrc.includes('.png')) {
                                // First attempt, try .png
                                e.target.src = `${basePath}.png`;
                              } else {
                                // All extensions failed, try resolveImageUrl
                                resolveImageUrl(question.questionImage).then(url => {
                                  if (url) {
                                    e.target.src = url;
                                    setResolvedImageUrls(prev => ({
                                      ...prev,
                                      [question.questionId]: url
                                    }));
                                  } else {
                                    console.warn(`⚠️ Could not load image for Q${question.questionNumber}`);
                                  }
                                }).catch(() => {
                                  console.warn(`⚠️ Could not resolve image for Q${question.questionNumber}`);
                                });
                              }
                            }}
                            onLoad={() => {
                              console.log(`✅ Loaded image for Q${question.questionNumber}`);
                            }}
                          />
                        </div>
                      )}

                      {question.questionText && question.questionText.trim() !== '' && question.questionText !== 'Question text not available' && (
                        <div className="question-text-breakdown">
                          <div dangerouslySetInnerHTML={{ __html: question.questionText }} />
                        </div>
                      )}
                      
                      {(!question.questionText || question.questionText.trim() === '' || question.questionText === 'Question text not available') && !question.questionImage && (
                        <div className="no-question-text">
                          <p className="warning-text">⚠️ Question image not available for this question.</p>
                        </div>
                      )}

                      {question.questionType !== 'integer' && question.options && question.options.length > 0 && (
                        <div className="options-breakdown">
                          {question.options.map((option, optIndex) => (
                            <div key={option.optionKey || option.optionId || optIndex} className="option-item">
                              <strong>{option.optionId}.</strong> {option.optionText || option.optionText}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="answer-comparison">
                        <div className="answer-row">
                          <span className="answer-label">Your Answer:</span>
                          <span className={`answer-value ${question.isCorrect ? 'correct' : question.userAnswer !== 'Not Attempted' ? 'incorrect' : 'unattempted'}`}>
                            {question.userAnswer || 'Not Attempted'}
                          </span>
                        </div>
                        <div className="answer-row">
                          <span className="answer-label">Correct Answer:</span>
                          <span className="answer-value correct">
                            {question.questionType === 'integer' 
                              ? (question.correctAnswer || question.correctIntegerAnswer || 'N/A')
                              : (question.correctAnswer || 'N/A')}
                          </span>
                        </div>
                        <div className="answer-row">
                          <span className="answer-label">Marks:</span>
                          <span className={`answer-value ${question.marks >= 0 ? 'positive' : 'negative'}`}>
                            {question.marks >= 0 ? '+' : ''}{question.marks}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-breakdown-data">
                    <p>Question breakdown data is not available for this test.</p>
                    <p className="sub-text">This may be an older test result. New tests will include detailed breakdown.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Modal */}
      <AnimatePresence>
        {showAnalysis && selectedTest && (
          <motion.div
            className="analysis-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAnalysis(false)}
          >
            <motion.div
              className="analysis-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="analysis-header">
                <h2>Test Analysis</h2>
                <button
                  className="close-button"
                  onClick={() => setShowAnalysis(false)}
                >
                  ✕
                </button>
              </div>
              <div className="analysis-content">
                <div className="analysis-summary">
                  <h3>{selectedTest?.testTitle || 'Test'}</h3>
                  <p className="test-date-analysis">Completed on {formatDate(selectedTest?.completedAt)}</p>
                  
                  <div className="overall-stats">
                    <div className="overall-stat">
                      <span className="overall-label">Total Marks:</span>
                      <span className="overall-value">{selectedTest?.totalMarks || 0} / {(selectedTest?.totalQuestions || 0) * 4}</span>
                    </div>
                    <div className="overall-stat">
                      <span className="overall-label">Percentage:</span>
                      <span className="overall-value" style={{ color: getPerformanceColor(selectedTest?.percentage || 0) }}>
                        {Math.round(selectedTest?.percentage || 0)}%
                      </span>
                    </div>
                  </div>

                  <div className="detailed-stats">
                    <div className="detail-stat correct">
                      <span className="detail-icon">✅</span>
                      <div className="detail-info">
                        <span className="detail-label">Correct Answers</span>
                        <span className="detail-value">{selectedTest?.correctAnswers || 0}</span>
                      </div>
                    </div>
                    <div className="detail-stat incorrect">
                      <span className="detail-icon">❌</span>
                      <div className="detail-info">
                        <span className="detail-label">Incorrect Answers</span>
                        <span className="detail-value">{selectedTest?.incorrectAnswers || 0}</span>
                      </div>
                    </div>
                    <div className="detail-stat unattempted">
                      <span className="detail-icon">⏭️</span>
                      <div className="detail-info">
                        <span className="detail-label">Unattempted</span>
                        <span className="detail-value">{selectedTest?.unattempted || 0}</span>
                      </div>
                    </div>
                    <div className="detail-stat time">
                      <span className="detail-icon">⏱️</span>
                      <div className="detail-info">
                        <span className="detail-label">Time Taken</span>
                        <span className="detail-value">{formatTime(selectedTest?.totalTestDuration || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedTest?.sectionWiseResults && Object.keys(selectedTest.sectionWiseResults).length > 0 && (
                    <div className="section-analysis">
                      <h3>Section-wise Performance</h3>
                      {Object.entries(selectedTest.sectionWiseResults).map(([sectionId, section]) => {
                        const sectionData = section || {};
                        const total = sectionData.total || 1;
                        const correct = sectionData.correct || 0;
                        return (
                          <div key={sectionId} className="section-result">
                            <div className="section-header">
                              <h4>{sectionData.name || 'Section'}</h4>
                              <span className="section-marks">{sectionData.marks || 0} marks</span>
                            </div>
                            <div className="section-details">
                              <div className="section-detail">
                                <span>Correct: {correct}</span>
                                <span>Incorrect: {sectionData.incorrect || 0}</span>
                                <span>Unattempted: {sectionData.unattempted || 0}</span>
                              </div>
                              <div className="section-progress-bar">
                                <div
                                  className="section-progress-fill"
                                  style={{
                                    width: `${Math.min((correct / total) * 100, 100)}%`,
                                    background: getPerformanceColor((correct / total) * 100)
                                  }}
                                />
                              </div>
                              <div className="section-time">
                                Time: {formatTime(sectionData.timeSpent || 0)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CBTDashboard;
