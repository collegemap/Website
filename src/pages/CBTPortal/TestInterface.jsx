import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../context/UserProfileContext';
import './TestInterface.scss';
import { loadImageBasedTest, resolveImageUrl } from './testLoader';
import TestResults from './TestResults';
import { saveTestResult, getUserProfile, reportQuestion } from '../../services/supabaseService';
// PDF feature disabled - dormant
// import { downloadTestAnalysisPDF } from './pdfGenerator';

const TestInterface = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { userProfile, refreshProfile } = useUserProfile();
  const [testData, setTestData] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({}); // Track questions marked for review
  const [visitedQuestions, setVisitedQuestions] = useState({}); // Track visited questions
  const [timeRemaining, setTimeRemaining] = useState(10800); // 3 hours in seconds
  const [questionTimeSpent, setQuestionTimeSpent] = useState({}); // Track time spent per question in seconds
  const [questionStartTime, setQuestionStartTime] = useState(null); // Track when current question was viewed
  const [testStartTime, setTestStartTime] = useState(null); // Track test start time
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [imageUrls, setImageUrls] = useState({}); // Cache resolved image URLs
  const [loadingImages, setLoadingImages] = useState(false);
  const [questionZoom, setQuestionZoom] = useState(100); // Zoom level for question (80-200%)
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const imageErrorAttempts = useRef({}); // Track error attempts per question to prevent infinite loops
  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const previousQuestionIdRef = useRef(null);
  const timeRemainingRef = useRef(10800); // Keep ref in sync with state
  const questionTimeSpentRef = useRef({});
  const questionStartTimeRef = useRef(null);

  const isFullscreenActive = () => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  };

  const exitFullscreen = () => {
    if (!isFullscreenActive()) return;
    
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } catch (error) {
      console.warn('Error exiting fullscreen:', error);
    }
  };

  // Shuffle array function (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Reorder questions: single correct first, then integer questions (no shuffling)
  const reorderTestData = (paperData) => {
    const reorderedData = JSON.parse(JSON.stringify(paperData)); // Deep clone

    reorderedData.sections.forEach((section, sectionIndex) => {
      // Separate questions by type
      const singleCorrectQuestions = [];
      const integerQuestions = [];
      const otherQuestions = [];
      
      section.questions.forEach(question => {
        if (question.questionType === 'integer') {
          integerQuestions.push(question);
        } else if (question.questionType === 'single-correct' || 
                   (!question.questionType && question.options && question.options.length > 0 && 
                    (!question.correctAnswer || (Array.isArray(question.correctAnswer) && question.correctAnswer.length === 1)))) {
          // Single correct: has questionType 'single-correct' OR has options and single correct answer
          singleCorrectQuestions.push(question);
        } else {
          // Multiple correct or other types
          otherQuestions.push(question);
        }
      });
      
      // Reorder: single correct first, then integer, then others
      section.questions = [...singleCorrectQuestions, ...integerQuestions, ...otherQuestions];
      
      // Renumber questions after reordering
      section.questions.forEach((q, index) => {
        q.questionNumber = index + 1;
      });

      // Keep options in original order (no shuffling)
      // Options remain as they are in the original data
    });

    return reorderedData;
  };

  const calculateResultsWithTime = useCallback((timeData) => {
    if (!testData) return null;

    let totalMarks = 0;
    let totalQuestions = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unattempted = 0;
    let unscoredCount = 0;
    const sectionWiseResults = {};
    const questionDetails = [];
    const totalTestDuration = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : 0;
    const isPracticeTest = testData.isPracticeOnly || testData.isCustomTest;

    testData.sections.forEach((section, sectionIndex) => {
      let sectionMarks = 0;
      let sectionCorrect = 0;
      let sectionIncorrect = 0;
      let sectionUnattempted = 0;
      let sectionUnscored = 0;
      let sectionTimeSpent = 0;

      section.questions.forEach(question => {
        totalQuestions++;
        const userAnswer = answers[question.questionId] || [];
        const timeSpent = timeData[question.questionId] || 0;
        sectionTimeSpent += timeSpent;
        
        let isCorrect = false;
        let isUnscored = false;
        let userAnswerDisplay = '';

        // Check if this question has scoring data
        const hasScoring = question.hasAnswerKey !== false && (
          (question.questionType === 'integer' && question.correctIntegerAnswer !== null && question.correctIntegerAnswer !== undefined) ||
          (question.questionType !== 'integer' && (question.correctAnswerKeys?.length > 0 || question.correctAnswer?.length > 0))
        );
        
        if (question.questionType === 'integer') {
          // Integer type question
          const userInteger = userAnswer[0] ? parseInt(userAnswer[0]) : null;
          const correctAnswer = question.correctIntegerAnswer;
          userAnswerDisplay = userInteger !== null && userInteger !== undefined ? userInteger.toString() : 'Not Attempted';
          
          if (userInteger === null || userInteger === undefined || isNaN(userInteger)) {
            unattempted++;
            sectionUnattempted++;
          } else if (!hasScoring) {
            // No correct answer available - practice mode
            isUnscored = true;
            unscoredCount++;
            sectionUnscored++;
          } else if (typeof correctAnswer === 'object' && correctAnswer.min !== undefined) {
            // Range answer
            if (userInteger >= correctAnswer.min && userInteger <= correctAnswer.max) {
              isCorrect = true;
            }
          } else {
            // Single value answer
            if (userInteger === correctAnswer) {
              isCorrect = true;
            }
          }
        } else {
          // Multiple choice question
          const correctAnswer = question.correctAnswerKeys || question.correctAnswer;
          
          if (userAnswer.length === 0) {
            unattempted++;
            sectionUnattempted++;
            userAnswerDisplay = 'Not Attempted';
          } else if (!hasScoring) {
            // No correct answer available - practice mode
            const selectedOptions = question.options
              .filter(opt => userAnswer.includes(opt.optionKey || opt.optionId))
              .map(opt => opt.optionId)
              .join(', ');
            userAnswerDisplay = selectedOptions || userAnswer.join(', ');
            isUnscored = true;
            unscoredCount++;
            sectionUnscored++;
          } else {
            // Map option keys to option IDs for display
            const selectedOptions = question.options
              .filter(opt => userAnswer.includes(opt.optionKey || opt.optionId))
              .map(opt => opt.optionId)
              .join(', ');
            userAnswerDisplay = selectedOptions || userAnswer.join(', ');
            
            if (JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort())) {
              isCorrect = true;
            }
          }
        }
        
        if (isUnscored) {
          // Don't add or deduct marks for unscored questions
        } else if (isCorrect) {
          correctAnswers++;
          sectionCorrect++;
          sectionMarks += question.marks;
          totalMarks += question.marks;
        } else if (userAnswer.length > 0 || (question.questionType === 'integer' && userAnswer[0] !== null && userAnswer[0] !== undefined)) {
          incorrectAnswers++;
          sectionIncorrect++;
          totalMarks += question.negativeMarks;
          sectionMarks += question.negativeMarks;
        }

        // Store question details for breakdown
        let correctAnswerDisplay = '';
        if (!hasScoring) {
          correctAnswerDisplay = 'Answer key not available';
        } else if (question.questionType === 'integer') {
          if (typeof question.correctIntegerAnswer === 'object' && question.correctIntegerAnswer.min !== undefined) {
            correctAnswerDisplay = `${question.correctIntegerAnswer.min} - ${question.correctIntegerAnswer.max}`;
          } else {
            correctAnswerDisplay = question.correctIntegerAnswer?.toString() || '';
          }
        } else {
          const correctOptions = question.options
            .filter(opt => (question.correctAnswerKeys || question.correctAnswer || []).includes(opt.optionKey || opt.optionId))
            .map(opt => `${opt.optionId}. ${opt.optionText}`)
            .join(', ');
          correctAnswerDisplay = correctOptions || (question.correctAnswerKeys || question.correctAnswer || []).join(', ');
        }

        questionDetails.push({
          questionId: question.questionId,
          questionNumber: question.questionNumber,
          sectionName: section.sectionName,
          sectionId: section.sectionId,
          questionText: question.questionText,
          questionImage: question.questionImage,
          questionType: question.questionType,
          options: question.options,
          userAnswer: userAnswerDisplay,
          correctAnswer: correctAnswerDisplay,
          isCorrect,
          isUnscored: isUnscored,
          timeSpent,
          marks: isUnscored ? 0 : isCorrect ? question.marks : (userAnswer.length > 0 || (question.questionType === 'integer' && userAnswer[0])) ? question.negativeMarks : 0
        });
      });

      sectionWiseResults[section.sectionId] = {
        name: section.sectionName,
        marks: sectionMarks,
        correct: sectionCorrect,
        incorrect: sectionIncorrect,
        unattempted: sectionUnattempted,
        unscored: sectionUnscored,
        total: section.questions.length,
        timeSpent: sectionTimeSpent
      };
    });

    return {
      totalMarks,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      unscoredCount,
      isPracticeTest: isPracticeTest || unscoredCount > 0,
      sectionWiseResults,
      questionDetails,
      totalTestDuration,
      percentage: ((totalMarks / (Math.max(1, (totalQuestions - unscoredCount)) * 4)) * 100).toFixed(2),
      fullscreenExitCount: fullscreenExitCount
    };
  }, [testData, answers, testStartTime, fullscreenExitCount]);

  const calculateResults = useCallback(() => {
    return calculateResultsWithTime(questionTimeSpent);
  }, [calculateResultsWithTime, questionTimeSpent]);

  // Save test results to Supabase
  const saveTestResults = useCallback(async (results) => {
    try {
      // Get user email from context profile
      if (!userProfile?.email) {
        console.warn('⚠️ No user profile found, cannot save results');
        return;
      }

      const userEmail = userProfile.email;

      if (!userEmail) {
        console.warn('⚠️ No user email found, cannot save results');
        return;
      }

      // Prepare test result data
      const testResultData = {
        testId: testId,
        testTitle: testData?.paperTitle || 'Test',
        totalMarks: results.totalMarks,
        totalQuestions: results.totalQuestions,
        correctAnswers: results.correctAnswers,
        incorrectAnswers: results.incorrectAnswers,
        unattempted: results.unattempted,
        percentage: parseFloat(results.percentage),
        totalTestDuration: results.totalTestDuration,
        sectionWiseResults: results.sectionWiseResults,
        fullscreenExitCount: results.fullscreenExitCount || 0,
        questionDetails: results.questionDetails || [],
        completedAt: new Date().toISOString()
      };

      // Save to Supabase
      console.log('💾 Saving test results to Supabase...');
      console.log('📝 User:', userEmail, '| Test:', testData?.paperTitle);

      const savedResult = await saveTestResult(testResultData, userEmail);
      
      if (savedResult) {
        console.log('✅ Test results saved to Supabase');
        return savedResult;
      } else {
        console.error('❌ Failed to save test results to Supabase');
      }
    } catch (error) {
      console.error('❌ Error in saveTestResults:', error);
    }
  }, [testId, testData, userProfile]);

  const handleAutoSubmit = useCallback(async () => {
    // Prevent multiple simultaneous submissions
    if (testSubmitted) return;
    
    // Save time spent on current question
    let updatedQuestionTime = { ...questionTimeSpent };
    if (previousQuestionIdRef.current && questionStartTime !== null) {
      const timeElapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      updatedQuestionTime[previousQuestionIdRef.current] = 
        (updatedQuestionTime[previousQuestionIdRef.current] || 0) + timeElapsed;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    // Calculate results with updated time data
    const results = calculateResultsWithTime(updatedQuestionTime);
    if (results) {
      setTestResults(results);
      setTestSubmitted(true);
      if (isFullscreenActive()) {
        exitFullscreen();
      }
      
      // Save test results to backend
      const saveResponse = await saveTestResults(results);
      
      // PDF feature disabled - dormant
      // Auto-download PDF analysis
      // setTimeout(async () => {
      //   try {
      //     const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      //     console.log('📄 Auto-generating PDF...');
      //     await downloadTestAnalysisPDF(results, testData, imageUrls, userProfile);
      //     console.log('✅ PDF auto-downloaded successfully');
      //   } catch (error) {
      //     console.error('❌ Error auto-downloading PDF:', error);
      //   }
      // }, 1500);
    }
  }, [testSubmitted, questionTimeSpent, questionStartTime, calculateResultsWithTime, saveTestResults, testData, imageUrls]);

  useEffect(() => {
    // Check if profile exists first
    if (!userProfile) {
      const emailStored = sessionStorage.getItem('userEmail');
      if (!emailStored) {
        navigate('/login', { state: { redirectTo: `/exams/test/${testId}` } });
        return;
      }
      // Load profile from Supabase
      refreshProfile(emailStored);
      return;
    }

    // Check if test was auto-submitted due to page refresh
    const lastTestResults = localStorage.getItem('lastTestResults');
    if (lastTestResults) {
      try {
        const savedData = JSON.parse(lastTestResults);
        // Check if it's for the current test and was auto-submitted
        if (savedData.autoSubmitted && savedData.testData && savedData.results) {
          // Show the results immediately
          setTestResults(savedData.results);
          setTestData(savedData.testData);
          setTestSubmitted(true);
          setImageUrls(savedData.imageUrls || {});
          // Clear the saved results
          localStorage.removeItem('lastTestResults');
          return;
        }
      } catch (error) {
        console.error('Error parsing saved test results:', error);
        localStorage.removeItem('lastTestResults');
      }
    }

    // Profile exists, proceed with test loading
    // Load image-based test directly using testId (which is the folder name)
    loadImageBasedTest(testId)
      .then(loadedData => {
        // Reorder questions: single correct first, then integer (no shuffling)
        const shuffledData = reorderTestData(loadedData);
        
        // Find first section with questions
        const firstValidSectionIndex = shuffledData.sections.findIndex(s => s.questions && s.questions.length > 0);
        if (firstValidSectionIndex === -1) {
          throw new Error('No questions found in test');
        }
        
        const initialDuration = shuffledData.duration || 10800;
        setTestData(shuffledData);
        setCurrentSection(firstValidSectionIndex);
        setCurrentQuestion(0);
        setTimeRemaining(initialDuration);
        timeRemainingRef.current = initialDuration;
        setTestStartTime(Date.now());
        
        // Initialize answers object
        const initialAnswers = {};
        const initialMarkedForReview = {};
        const initialVisited = {};
        const initialQuestionTime = {};
        shuffledData.sections.forEach(section => {
          if (section.questions && section.questions.length > 0) {
            section.questions.forEach(q => {
              initialAnswers[q.questionId] = [];
              initialMarkedForReview[q.questionId] = false;
              initialVisited[q.questionId] = false;
              initialQuestionTime[q.questionId] = 0;
            });
          }
        });
        setAnswers(initialAnswers);
        setMarkedForReview(initialMarkedForReview);
        setVisitedQuestions(initialVisited);
        setQuestionTimeSpent(initialQuestionTime);
        
        // Lazy loading - images will load on-demand when questions are viewed
        // No preloading to save memory/disk space
      })
      .catch(error => {
        console.error('Error loading test:', error);
        navigate('/exams');
      });
  }, [testId, navigate]);

  // Lazy load image for current question only - saves memory/disk space - MEMOIZED
  const loadCurrentQuestionImage = useCallback(async (question) => {
    if (!question || !question.questionImage) return;
    
    const questionId = question.questionId;
    
    setLoadingImages(true);
    
    try {
      // Try .png first since all images are .png
      const extensions = ['.png', '.jpg', '.jpeg'];
      let found = false;
      
      for (const ext of extensions) {
        const testUrl = `${question.questionImage}${ext}`;
        try {
          const response = await fetch(testUrl, { method: 'GET' });
          if (response.ok) {
            setImageUrls(prev => ({
              ...prev,
              [questionId]: testUrl
            }));
            console.log(`✅ Loaded: ${question.sectionName || 'Question'} Q${question.questionNumber} (${ext})`);
            found = true;
            break;
          }
        } catch (e) {
          // Continue to next extension
        }
      }
      
      if (!found) {
        // Try resolveImageUrl as fallback
        const resolvedUrl = await resolveImageUrl(question.questionImage);
        if (resolvedUrl) {
          setImageUrls(prev => ({
            ...prev,
            [questionId]: resolvedUrl
          }));
          console.log(`✅ Resolved: ${question.sectionName || 'Question'} Q${question.questionNumber}`);
        } else {
          console.warn(`⚠️ Image not found: Q${question.questionNumber} - ${question.questionImage}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error loading image for Q${question.questionNumber}:`, error);
    } finally {
      setLoadingImages(false);
    }
  }, [imageUrls]);
  
  // Unload images for questions not currently being viewed (keep only current and previous 2)
  const cleanupOldImages = useCallback(() => {
    if (!testData) return;
    
    // Keep current question and previous 2 questions in cache
    const questionsToKeep = new Set();
    
    // Get current section data
    const currentSectionData = testData.sections[currentSection];
    if (!currentSectionData || !currentSectionData.questions) return;
    
    // Add current question
    const safeQuestionIndex = Math.min(currentQuestion, currentSectionData.questions.length - 1);
    const currentQ = currentSectionData.questions[safeQuestionIndex];
    if (currentQ) {
      questionsToKeep.add(currentQ.questionId);
    }
    
    // Add previous 2 questions from current section
    if (currentQuestion > 0) {
      for (let i = Math.max(0, currentQuestion - 2); i < currentQuestion; i++) {
        if (currentSectionData.questions[i]) {
          questionsToKeep.add(currentSectionData.questions[i].questionId);
        }
      }
    }
    
    // Remove images not in the keep list
    setImageUrls(prev => {
      const cleaned = {};
      questionsToKeep.forEach(qId => {
        if (prev[qId]) {
          cleaned[qId] = prev[qId];
        }
      });
      
      const removed = Object.keys(prev).length - Object.keys(cleaned).length;
      if (removed > 0) {
        console.log(`🧹 Cleaned up ${removed} old images from cache`);
      }
      
      return cleaned;
    });
  }, [testData, currentSection, currentQuestion]);

  // Keep refs in sync with state for timer
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    questionTimeSpentRef.current = questionTimeSpent;
  }, [questionTimeSpent]);

  useEffect(() => {
    questionStartTimeRef.current = questionStartTime;
  }, [questionStartTime]);

  // Timer effect - FIXED: Countdown timer that auto-submits at 0
  useEffect(() => {
    if (testSubmitted) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Only start timer if we have test data loaded
    if (!testData) {
      return;
    }

    // Clear any existing timer before starting a new one
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Start the countdown timer - runs every second
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        // Update ref to keep it in sync
        timeRemainingRef.current = prev;
        
        // If already at 0 or below, don't decrement further
        if (prev <= 0) {
          return 0;
        }
        
        const newTime = prev - 1;
        timeRemainingRef.current = newTime;
        
        // When timer hits 0, auto-submit
        if (newTime <= 0) {
          // Clear the interval first
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Auto-submit the test
          (async () => {
            let updatedQuestionTime = { ...questionTimeSpentRef.current };
            if (previousQuestionIdRef.current && questionStartTimeRef.current !== null) {
              const timeElapsed = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
              updatedQuestionTime[previousQuestionIdRef.current] = 
                (updatedQuestionTime[previousQuestionIdRef.current] || 0) + timeElapsed;
            }
            
            const results = calculateResultsWithTime(updatedQuestionTime);
            if (results) {
              setTestResults(results);
              setTestSubmitted(true);
              if (isFullscreenActive()) {
                exitFullscreen();
              }
              await saveTestResults(results);
            }
          })();
          
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [testSubmitted, testData]);

  // Fullscreen on mount
  useEffect(() => {
    if (testData && !testSubmitted && validSections.length > 0) {
      enterFullscreen();
    }
  }, [testData, testSubmitted]);

  // Auto-submit on page refresh/close
  useEffect(() => {
    if (!testData || testSubmitted) return;

    const handlePageUnload = (e) => {
      // Auto-submit the test when page is being refreshed or closed
      if (testSubmitted) return;
      
      // Save time spent on current question
      let updatedQuestionTime = { ...questionTimeSpentRef.current };
      if (previousQuestionIdRef.current && questionStartTimeRef.current !== null) {
        const timeElapsed = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
        updatedQuestionTime[previousQuestionIdRef.current] = 
          (updatedQuestionTime[previousQuestionIdRef.current] || 0) + timeElapsed;
      }
      
      // Calculate results synchronously
      const results = calculateResultsWithTime(updatedQuestionTime);
      if (results) {
        try {
          const testResultData = {
            testId: testId,
            testTitle: testData?.paperTitle || 'Test',
            totalMarks: results.totalMarks,
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            incorrectAnswers: results.incorrectAnswers,
            unattempted: results.unattempted,
            percentage: parseFloat(results.percentage),
            totalTestDuration: results.totalTestDuration,
            sectionWiseResults: results.sectionWiseResults,
            fullscreenExitCount: results.fullscreenExitCount || 0,
            completedAt: new Date().toISOString(),
            autoSubmitted: true,
            reason: 'page_refresh'
          };

          // Save to localStorage (synchronous, reliable)
          const pendingResults = JSON.parse(localStorage.getItem('pendingTestResults') || '[]');
          pendingResults.push({
            ...testResultData,
            userProfile: userProfile,
            synced: false
          });
          localStorage.setItem('pendingTestResults', JSON.stringify(pendingResults));
          
          // Save complete results for immediate display on reload
          localStorage.setItem('lastTestResults', JSON.stringify({
            results,
            testData,
            imageUrls,
            timestamp: Date.now(),
            autoSubmitted: true
          }));

          // Try sendBeacon for async server save (non-blocking)
          if (navigator.sendBeacon && userProfile?.email) {
            try {
              const blob = new Blob(
                [JSON.stringify(testResultData)],
                { type: 'application/json' }
              );
              // Note: sendBeacon doesn't support custom headers, so we'll save to pending queue
              // The pending queue will be synced later
            } catch (beaconError) {
              // Fallback: already saved to pendingResults
            }
          }
        } catch (error) {
          console.error('Error saving on page unload:', error);
        }
      }
    };

    const handleBeforeUnload = (e) => {
      // Show browser warning and prepare for auto-submit
      e.preventDefault();
      e.returnValue = 'Your test will be automatically submitted if you leave this page.';
      handlePageUnload(e);
      return e.returnValue;
    };

    // Use pagehide for more reliable detection (fires after beforeunload)
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageUnload);
    };
  }, [testData, testSubmitted, testId, calculateResultsWithTime]);

  // Detect fullscreen exit - track count and show warning (no auto-submit)
  useEffect(() => {
    if (!testData || testSubmitted) return;

    const handleFullscreenChange = () => {
      if (!isFullscreenActive() && !testSubmitted) {
        // Increment exit count
        setFullscreenExitCount(prev => prev + 1);
        // Show warning modal
        setShowExitWarning(true);
        // Note: Timer continues running, no auto-submit
      } else if (isFullscreenActive() && showExitWarning) {
        // If fullscreen is re-entered, hide the warning
        setShowExitWarning(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [testData, testSubmitted, showExitWarning]);

  const enterFullscreen = async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen permission denied or not supported:', error);
      // Continue without fullscreen - don't block the test
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, optionId, isMultiple) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (isMultiple) {
        if (currentAnswers.includes(optionId)) {
          return { ...prev, [questionId]: currentAnswers.filter(id => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...currentAnswers, optionId] };
        }
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
    });
  };

  const handleIntegerAnswerChange = (questionId, value) => {
    setAnswers(prev => {
      // Store as array with single integer value
      return { ...prev, [questionId]: value ? [value] : [] };
    });
  };

  const handleNextQuestion = () => {
    if (!testData) return;
    const validSections = testData.sections.filter(s => s.questions && s.questions.length > 0);
    const sectionIndex = validSections.findIndex(s => s.sectionId === testData.sections[currentSection].sectionId);
    
    if (sectionIndex === -1) return;
    
    const section = validSections[sectionIndex];
    const questionIndex = section.questions.findIndex(q => q.questionId === currentQuestionData?.questionId);
    
    if (questionIndex === -1) return;
    
    // Mark current question as visited before moving
    const currentQ = section.questions[questionIndex];
    setVisitedQuestions(prev => ({
      ...prev,
      [currentQ.questionId]: true
    }));
    
    if (questionIndex < section.questions.length - 1) {
      setCurrentQuestion(questionIndex + 1);
      // Mark next question as visited
      const nextQ = section.questions[questionIndex + 1];
      setVisitedQuestions(prev => ({
        ...prev,
        [nextQ.questionId]: true
      }));
    } else if (sectionIndex < validSections.length - 1) {
      const nextSection = validSections[sectionIndex + 1];
      const originalNextIndex = testData.sections.findIndex(s => s.sectionId === nextSection.sectionId);
      setCurrentSection(originalNextIndex);
      setCurrentQuestion(0);
      // Mark first question of next section as visited
      if (nextSection.questions.length > 0) {
        setVisitedQuestions(prev => ({
          ...prev,
          [nextSection.questions[0].questionId]: true
        }));
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (!testData) return;
    const validSections = testData.sections.filter(s => s.questions && s.questions.length > 0);
    const sectionIndex = validSections.findIndex(s => s.sectionId === testData.sections[currentSection].sectionId);
    
    if (sectionIndex === -1) return;
    
    const section = validSections[sectionIndex];
    const questionIndex = section.questions.findIndex(q => q.questionId === currentQuestionData?.questionId);
    
    if (questionIndex === -1) return;
    
    // Mark current question as visited before moving
    const currentQ = section.questions[questionIndex];
    setVisitedQuestions(prev => ({
      ...prev,
      [currentQ.questionId]: true
    }));
    
    if (questionIndex > 0) {
      setCurrentQuestion(questionIndex - 1);
      // Mark previous question as visited
      const prevQ = section.questions[questionIndex - 1];
      setVisitedQuestions(prev => ({
        ...prev,
        [prevQ.questionId]: true
      }));
    } else if (sectionIndex > 0) {
      const prevSection = validSections[sectionIndex - 1];
      const originalPrevIndex = testData.sections.findIndex(s => s.sectionId === prevSection.sectionId);
      setCurrentSection(originalPrevIndex);
      setCurrentQuestion(prevSection.questions.length - 1);
      // Mark last question of previous section as visited
      const lastQ = prevSection.questions[prevSection.questions.length - 1];
      setVisitedQuestions(prev => ({
        ...prev,
        [lastQ.questionId]: true
      }));
    }
  };

  const handleSectionChange = (sectionIndex) => {
    if (!testData) return;
    
    const newSection = testData.sections[sectionIndex];
    if (!newSection || !newSection.questions || newSection.questions.length === 0) {
      return; // Don't switch to empty section
    }
    
    // Mark current question as visited
    const validSections = testData.sections.filter(s => s.questions && s.questions.length > 0);
    const currentSectionIndex = validSections.findIndex(s => s.sectionId === testData.sections[currentSection]?.sectionId);
    
    if (currentSectionIndex !== -1) {
      const currentSectionData = validSections[currentSectionIndex];
      const questionIndex = currentSectionData.questions.findIndex(q => q.questionId === currentQuestionData?.questionId);
      if (questionIndex !== -1) {
        const currentQ = currentSectionData.questions[questionIndex];
        setVisitedQuestions(prev => ({
          ...prev,
          [currentQ.questionId]: true
        }));
      }
    }
    
    setCurrentSection(sectionIndex);
    setCurrentQuestion(0);
    // Mark first question of new section as visited
    if (newSection.questions.length > 0) {
      setVisitedQuestions(prev => ({
        ...prev,
        [newSection.questions[0].questionId]: true
      }));
    }
  };

  const handleQuestionJump = (sectionIndex, questionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentQuestion(questionIndex);
    // Mark question as visited
    if (testData) {
      const question = testData.sections[sectionIndex].questions[questionIndex];
      setVisitedQuestions(prev => ({
        ...prev,
        [question.questionId]: true
      }));
    }
  };

  const handleMarkForReview = () => {
    if (!testData) return;
    const question = testData.sections[currentSection].questions[currentQuestion];
    setMarkedForReview(prev => ({
      ...prev,
      [question.questionId]: !prev[question.questionId]
    }));
  };

  const handleMarkForReviewAndNext = () => {
    handleMarkForReview();
    handleNextQuestion();
  };

  const handleOpenReportModal = () => {
    setReportReason('');
    setReportDescription('');
    setReportSubmitted(false);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
  };

  const handleSubmitReport = async () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    const email = localStorage.getItem('userEmail') || userProfile?.email || null;
    await reportQuestion({
      testId: testData?.paperId || testData?.testId || '',
      testTitle: testData?.paperTitle || testData?.title || '',
      questionId: currentQuestionData?.questionId || '',
      questionNumber: currentQuestionData?.questionNumber || null,
      subject: currentSectionData?.sectionName || null,
      reason: reportReason,
      description: reportDescription,
      userEmail: email,
    });
    setReportSubmitting(false);
    setReportSubmitted(true);
  };

  const handleSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = async () => {
    // Save time spent on current question
    let updatedQuestionTime = { ...questionTimeSpent };
    if (previousQuestionIdRef.current && questionStartTime !== null) {
      const timeElapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      updatedQuestionTime[previousQuestionIdRef.current] = 
        (updatedQuestionTime[previousQuestionIdRef.current] || 0) + timeElapsed;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    // Calculate results with updated time data
    setQuestionTimeSpent(updatedQuestionTime);
    const results = calculateResultsWithTime(updatedQuestionTime);
    if (results) {
      setTestResults(results);
      setTestSubmitted(true);
      if (isFullscreenActive()) {
        exitFullscreen();
      }
      setShowSubmitConfirm(false);
      
      // Save test results to backend
      const saveResponse = await saveTestResults(results);
      
      // PDF feature disabled - dormant
      // Auto-download PDF analysis
      // setTimeout(async () => {
      //   try {
      //     const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      //     console.log('📄 Auto-generating PDF...');
      //     await downloadTestAnalysisPDF(results, testData, imageUrls, userProfile);
      //     console.log('✅ PDF auto-downloaded successfully');
      //   } catch (error) {
      //     console.error('❌ Error auto-downloading PDF:', error);
      //   }
      // }, 1500);
    }
  };

  const cancelSubmit = () => {
    setShowSubmitConfirm(false);
  };

  // Count answered questions
  const getAnsweredCount = useCallback(() => {
    if (!testData) return 0;
    let count = 0;
    testData.sections.forEach(section => {
      section.questions.forEach(q => {
        const answer = answers[q.questionId];
        if (answer && answer.length > 0) {
          // For integer type, check if value is not empty
          if (q.questionType === 'integer') {
            if (answer[0] !== null && answer[0] !== undefined && answer[0] !== '') {
              count++;
            }
          } else {
            count++;
          }
        }
      });
    });
    return count;
  }, [testData, answers]);

  // Calculate question statistics
  const getQuestionStatistics = useCallback(() => {
    if (!testData) return { answered: 0, notAnswered: 0, notVisited: 0, marked: 0, total: 0 };
    
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let marked = 0;
    const total = testData.totalQuestions;

    testData.sections.forEach(section => {
      section.questions.forEach(q => {
        const answer = answers[q.questionId] || [];
        const isVisited = visitedQuestions[q.questionId] || false;
        const isMarked = markedForReview[q.questionId] || false;
        
        if (isMarked) marked++;
        
        if (!isVisited) {
          notVisited++;
        } else {
          // Check if answered
          let hasAnswer = false;
          if (answer && answer.length > 0) {
            if (q.questionType === 'integer') {
              hasAnswer = answer[0] !== null && answer[0] !== undefined && answer[0] !== '';
            } else {
              hasAnswer = true;
            }
          }
          
          if (hasAnswer) {
            answered++;
          } else {
            notAnswered++;
          }
        }
      });
    });

    return { answered, notAnswered, notVisited, marked, total };
  }, [testData, answers, visitedQuestions, markedForReview]);

  // Mark current question as visited, track time spent, and load image lazily
  useEffect(() => {
    if (!testData || testSubmitted) return;
    
    const currentSectionData = testData.sections[currentSection];
    if (!currentSectionData || !currentSectionData.questions || currentSectionData.questions.length === 0) {
      return;
    }
    
    // Ensure currentQuestion is within bounds
    const safeQuestionIndex = Math.min(currentQuestion, currentSectionData.questions.length - 1);
    const question = currentSectionData.questions[safeQuestionIndex];
    
    if (!question) return;
    
    // Save time spent on previous question before switching
    if (previousQuestionIdRef.current && questionStartTime !== null) {
      const timeElapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimeSpent(prev => ({
        ...prev,
        [previousQuestionIdRef.current]: (prev[previousQuestionIdRef.current] || 0) + timeElapsed
      }));
    }

    // Mark question as visited
    setVisitedQuestions(prev => ({
      ...prev,
      [question.questionId]: true
    }));

    // Update previous question reference and start time tracking
    previousQuestionIdRef.current = question.questionId;
    setQuestionStartTime(Date.now());
    
    // Load image for current question only (lazy loading)
    loadCurrentQuestionImage(question);
    
    // Clean up old images (keep only current and previous 2)
    cleanupOldImages();
    
    // Sync currentQuestion if it was out of bounds
    if (safeQuestionIndex !== currentQuestion) {
      setCurrentQuestion(safeQuestionIndex);
    }
  }, [currentSection, currentQuestion, testData, testSubmitted]); // Removed loadCurrentQuestionImage and cleanupOldImages to avoid infinite loop

  if (!testData) {
    return <div className="loading">Loading test...</div>;
  }

  if (testSubmitted && testResults) {
    return <TestResults results={testResults} testData={testData} imageUrls={imageUrls} userProfile={userProfile} />;
  }

  // Filter out sections with no questions
  const validSections = testData.sections.filter(section => section.questions && section.questions.length > 0);
  
  if (validSections.length === 0) {
    return (
      <div className="loading">
        <h3>No questions available</h3>
        <p>This test does not have any questions configured yet.</p>
        <button onClick={() => navigate('/exams')}>Back to Portal</button>
      </div>
    );
  }

  // Find the current section in validSections
  const currentSectionDataOriginal = testData.sections[currentSection];
  let currentSectionData = currentSectionDataOriginal;
  let safeSectionIndex = validSections.findIndex(s => s.sectionId === currentSectionDataOriginal?.sectionId);
  
  // If current section has no questions, use first valid section
  if (safeSectionIndex === -1 || !currentSectionDataOriginal || !currentSectionDataOriginal.questions || currentSectionDataOriginal.questions.length === 0) {
    safeSectionIndex = 0;
    currentSectionData = validSections[0];
    // Update state to point to valid section
    const originalIndex = testData.sections.findIndex(s => s.sectionId === currentSectionData.sectionId);
    if (originalIndex !== -1 && originalIndex !== currentSection) {
      setCurrentSection(originalIndex);
      setCurrentQuestion(0);
    }
  } else {
    currentSectionData = validSections[safeSectionIndex];
  }
  
  // Ensure currentQuestion is valid
  const safeQuestionIndex = Math.min(currentQuestion, currentSectionData.questions.length - 1);
  const currentQuestionData = currentSectionData.questions[safeQuestionIndex];
  
  // Sync question index if needed
  if (safeQuestionIndex !== currentQuestion && currentSectionData === currentSectionDataOriginal) {
    setCurrentQuestion(safeQuestionIndex);
  }
  
  // Safety check - if still undefined, show error
  if (!currentQuestionData) {
    return (
      <div className="loading">
        <h3>Error loading question</h3>
        <p>Unable to load the current question. Please try again.</p>
        <button onClick={() => navigate('/exams')}>Back to Portal</button>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestionData.questionId] || [];
  const questionStats = getQuestionStatistics();

  return (
    <div className={`test-interface jee-style nta-official ${showExitWarning ? 'blurred' : ''}`}>
      {/* NTA JEE Mains Header */}
      <div className="jee-test-header">
        <div className="header-top-bar">
          <div className="candidate-profile">
            <div className="profile-image">
              <div className="avatar-placeholder">👤</div>
            </div>
            <div className="candidate-details">
              <div className="detail-row">
                <span className="detail-label">Candidate Name</span>
                <span className="detail-separator">:</span>
                <span className="detail-value">
                  {userProfile?.name || '[Your Name]'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Exam Name</span>
                <span className="detail-separator">:</span>
                <span className="detail-value">JEE-Main</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Subject Name</span>
                <span className="detail-separator">:</span>
                <span className="detail-value orange-text">{testData.paperTitle}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Remaining Time</span>
                <span className="detail-separator">:</span>
                <span className={`detail-value timer-value ${timeRemaining < 600 ? 'warning' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <div className="language-selector-top">
            <select className="language-dropdown">
              <option>English</option>
            </select>
          </div>
        </div>
        
        <div className="header-tabs">
          {validSections.map((section, index) => {
            // Find original index in testData.sections
            const originalIndex = testData.sections.findIndex(s => s.sectionId === section.sectionId);
            return (
              <button
                key={section.sectionId}
                className={`subject-tab ${safeSectionIndex === index ? 'active' : ''}`}
                onClick={() => handleSectionChange(originalIndex)}
              >
                {section.sectionName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="jee-test-body">
        {/* Main Question Section */}
        <div className="jee-question-panel">
          <div className="question-header-bar">
            <span className="question-number-display">Question No. {currentQuestionData.questionNumber}</span>
            <div className="question-zoom-controls">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setQuestionZoom((z) => Math.max(80, z - 25))}
                title="Zoom out"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="zoom-level">{questionZoom}%</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setQuestionZoom((z) => Math.min(200, z + 25))}
                title="Zoom in"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                className="zoom-reset-btn"
                onClick={() => setQuestionZoom(100)}
                title="Reset zoom"
                aria-label="Reset zoom"
              >
                Reset
              </button>
            </div>
            <button
              type="button"
              className="report-question-btn"
              onClick={handleOpenReportModal}
              title="Report an issue with this question"
            >
              ⚑ Report
            </button>
          </div>

          <div
            className="question-content-area"
            style={{ zoom: questionZoom / 100 }}
          >
            {/* Image-based questions - no text display */}
            {currentQuestionData.questionImage && (
              <div className="question-image-wrapper">
                {loadingImages ? (
                  <div className="image-loading">Loading question image...</div>
                ) : (
                  <img 
                    src={imageUrls[currentQuestionData.questionId] || 
                         (currentQuestionData.questionImage.match(/\.(png|jpe?g)$/i) ? currentQuestionData.questionImage : `${currentQuestionData.questionImage}.png`)} 
                    alt={`Question ${currentQuestionData.questionNumber}`} 
                    className="question-image"
                    onError={(e) => {
                      // Try all extensions systematically
                      const basePath = currentQuestionData.questionImage.replace(/\.(png|jpe?g)$/i, '');
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
                      if (currentExtIndex < extensions.length - 1) {
                        const nextExt = extensions[currentExtIndex + 1];
                        e.target.src = `${basePath}${nextExt}`;
                        console.log(`🔄 Trying ${nextExt} for Q${currentQuestionData.questionNumber}`);
                      } else {
                        // Try first extension again (cycle)
                        e.target.src = `${basePath}${extensions[0]}`;
                        console.log(`🔄 Cycling back to ${extensions[0]} for Q${currentQuestionData.questionNumber}`);
                      }
                    }}
                    onLoad={(e) => {
                      // Image loaded successfully, cache it
                      const loadedUrl = e.target.src;
                      if (!imageUrls[currentQuestionData.questionId]) {
                        setImageUrls(prev => ({
                          ...prev,
                          [currentQuestionData.questionId]: loadedUrl
                        }));
                        console.log(`✅ Cached image for Q${currentQuestionData.questionNumber}: ${loadedUrl}`);
                      }
                    }}
                  />
                )}
              </div>
            )}

            {currentQuestionData.questionType === 'integer' ? (
              <div className="integer-answer-input">
                <input
                  type="number"
                  className="integer-field"
                  value={currentAnswer[0] || ''}
                  onChange={(e) => handleIntegerAnswerChange(currentQuestionData.questionId, e.target.value)}
                  placeholder="Enter integer value"
                  step="1"
                />
              </div>
            ) : (
              <div className="options-list">
                {currentQuestionData.options.map((option) => {
                  const isSelected = currentAnswer.includes(option.optionKey || option.optionId);
                  const isMultiple = currentQuestionData.questionType === 'multiple-correct';
                  const optionKey = option.optionKey || option.optionId;
                  return (
                    <label
                      key={optionKey}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type={isMultiple ? 'checkbox' : 'radio'}
                        name={`question-${currentQuestionData.questionId}`}
                        value={optionKey}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(currentQuestionData.questionId, optionKey, isMultiple)}
                      />
                      <span className="option-number">({option.optionId})</span>
                      <span className="option-content">{option.optionText}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div className="jee-action-buttons">
            <button
              className="jee-btn save-next"
              onClick={handleNextQuestion}
              disabled={safeSectionIndex === validSections.length - 1 && 
                       safeQuestionIndex === currentSectionData.questions.length - 1}
            >
              SAVE & NEXT
            </button>
            <button
              className="jee-btn save-mark"
              onClick={handleMarkForReviewAndNext}
              disabled={safeSectionIndex === validSections.length - 1 && 
                       safeQuestionIndex === currentSectionData.questions.length - 1}
            >
              SAVE & MARK FOR REVIEW
            </button>
            <button
              className="jee-btn clear-response"
              onClick={() => {
                setAnswers(prev => ({
                  ...prev,
                  [currentQuestionData.questionId]: []
                }));
              }}
            >
              CLEAR RESPONSE
            </button>
            <button
              className="jee-btn mark-review-next"
              onClick={handleMarkForReviewAndNext}
              disabled={safeSectionIndex === validSections.length - 1 && 
                       safeQuestionIndex === currentSectionData.questions.length - 1}
            >
              MARK FOR REVIEW & NEXT
            </button>
          </div>

          {/* Navigation Arrows - Mobile */}
          <div className="mobile-navigation">
            <button
              className="mobile-nav-btn"
              onClick={handlePreviousQuestion}
              disabled={currentSection === 0 && currentQuestion === 0}
            >
              &lt;&lt; BACK
            </button>
            <button
              className="mobile-nav-btn"
              onClick={handleNextQuestion}
              disabled={safeSectionIndex === validSections.length - 1 && 
                       safeQuestionIndex === currentSectionData.questions.length - 1}
            >
              NEXT &gt;&gt;
            </button>
          </div>
        </div>

        {/* Right Sidebar - Question Navigator */}
        <div className="jee-question-navigator">
          <div className="navigator-content">
            <div className="question-grid">
              {currentSectionData.questions.map((q, qIndex) => {
                const answer = answers[q.questionId];
                const isVisited = visitedQuestions[q.questionId] || false;
                let isAnswered = false;
                if (answer && answer.length > 0) {
                  if (q.questionType === 'integer') {
                    isAnswered = answer[0] !== null && answer[0] !== undefined && answer[0] !== '';
                  } else {
                    isAnswered = true;
                  }
                }
                const isMarked = markedForReview[q.questionId] || false;
                const isCurrent = currentQuestion === qIndex;
                
                let statusClass = 'not-visited';
                if (!isVisited) {
                  statusClass = 'not-visited';
                } else if (isMarked && isAnswered) {
                  statusClass = 'marked-answered';
                } else if (isMarked && !isAnswered) {
                  statusClass = 'marked-not-answered';
                } else if (isAnswered) {
                  statusClass = 'answered';
                } else {
                  statusClass = 'not-answered';
                }
                
                return (
                  <button
                    key={q.questionId}
                    className={`question-num-btn ${statusClass} ${isCurrent ? 'current' : ''}`}
                    onClick={() => {
                      // Find original section index
                      const originalSectionIndex = testData.sections.findIndex(s => s.sectionId === currentSectionData.sectionId);
                      handleQuestionJump(originalSectionIndex, qIndex);
                    }}
                  >
                    {q.questionNumber}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="question-legend">
              <div className="legend-item">
                <div className="legend-box not-visited"></div>
                <span>Not Visited</span>
              </div>
              <div className="legend-item">
                <div className="legend-box not-answered"></div>
                <span>Not Answered</span>
              </div>
              <div className="legend-item">
                <div className="legend-box answered"></div>
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <div className="legend-box marked-answered"></div>
                <span>Marked & Answered</span>
              </div>
              <div className="legend-item">
                <div className="legend-box marked-not-answered"></div>
                <span>Marked for Review</span>
              </div>
            </div>

            {/* Submit Button */}
            <button className="jee-submit-button" onClick={handleSubmit}>
              SUBMIT
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div
            className="submit-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelSubmit}
          >
            <motion.div
              className="submit-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Confirm Submission</h3>
              <p>Are you sure you want to submit the test? You have answered {getAnsweredCount()} out of {testData.totalQuestions} questions.</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={cancelSubmit}>Cancel</button>
                <button className="confirm-btn" onClick={confirmSubmit}>Submit</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showExitWarning && (
          <motion.div
            className="exit-warning-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="exit-warning-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="warning-icon">⚠️</div>
              <h3>Fullscreen Exited</h3>
              <p>You have exited fullscreen mode.</p>
              <p className="warning-message">
                <strong>Warning:</strong> If you exit fullscreen <strong>3 times</strong>, the test will be automatically submitted.
              </p>
              <p className="exit-count">
                Fullscreen exits: <strong>{fullscreenExitCount}</strong> / 3
              </p>
              <div className="modal-actions">
                <button 
                  className="enter-fullscreen-btn" 
                  onClick={async () => {
                    await enterFullscreen();
                    setShowExitWarning(false);
                  }}
                >
                  Enter Fullscreen Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCalculator && (
          <Calculator 
            onClose={() => setShowCalculator(false)}
          />
        )}

        {showReportModal && (
          <motion.div
            className="submit-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseReportModal}
          >
            <motion.div
              className="submit-modal report-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {reportSubmitted ? (
                <>
                  <div className="report-success-icon">✅</div>
                  <h3>Report Submitted</h3>
                  <p>Thank you! Your report for Question {currentQuestionData?.questionNumber} has been submitted. We'll review it shortly.</p>
                  <div className="modal-actions">
                    <button className="confirm-btn" onClick={handleCloseReportModal}>Close</button>
                  </div>
                </>
              ) : (
                <>
                  <h3>⚑ Report Question {currentQuestionData?.questionNumber}</h3>
                  <p>Please describe the issue with this question so we can investigate and fix it.</p>
                  <div className="report-form">
                    <label className="report-label">Reason <span className="required">*</span></label>
                    <select
                      className="report-select"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                    >
                      <option value="">-- Select a reason --</option>
                      <option value="Image not loading">Image not loading</option>
                      <option value="Question is blurry/unclear">Question is blurry / unclear</option>
                      <option value="Question is cut off">Question is cut off</option>
                      <option value="Duplicate question">Duplicate question</option>
                      <option value="Other">Other</option>
                    </select>
                    <label className="report-label">Additional details (optional)</label>
                    <textarea
                      className="report-textarea"
                      rows={3}
                      placeholder="Describe the issue..."
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={handleCloseReportModal} disabled={reportSubmitting}>Cancel</button>
                    <button
                      className="confirm-btn report-submit-btn"
                      onClick={handleSubmitReport}
                      disabled={!reportReason || reportSubmitting}
                    >
                      {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Calculator Component - Optimized and Floating with Drag & Resize
const Calculator = React.memo(({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  
  // Drag and resize state
  const [position, setPosition] = useState({ x: window.innerWidth - 360, y: 80 });
  const [size, setSize] = useState({ width: 320, height: 420 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const calculatorRef = useRef(null);

  const inputNumber = useCallback((num) => {
    setDisplay(prev => {
      if (waitingForNewValue) {
        setWaitingForNewValue(false);
        return String(num);
      }
      return prev === '0' ? String(num) : prev + num;
    });
  }, [waitingForNewValue]);

  const inputDecimal = useCallback(() => {
    setDisplay(prev => {
      if (waitingForNewValue) {
        setWaitingForNewValue(false);
        return '0.';
      }
      return prev.indexOf('.') === -1 ? prev + '.' : prev;
    });
  }, [waitingForNewValue]);

  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  }, []);

  const calculate = useCallback((firstValue, secondValue, op) => {
    switch (op) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      default:
        return secondValue;
    }
  }, []);

  const performOperation = useCallback((nextOperation) => {
    setDisplay(prev => {
      const inputValue = parseFloat(prev);
      
      setPreviousValue(prevVal => {
        if (prevVal === null) {
          return inputValue;
        } else if (operation) {
          const newValue = calculate(prevVal, inputValue, operation);
          setDisplay(String(newValue));
          return newValue;
        }
        return prevVal;
      });
      
      setWaitingForNewValue(true);
      setOperation(nextOperation);
      return prev;
    });
  }, [operation, calculate]);

  const handleEquals = useCallback(() => {
    setDisplay(prev => {
      const inputValue = parseFloat(prev);
      
      if (previousValue !== null && operation) {
        const newValue = calculate(previousValue, inputValue, operation);
        setPreviousValue(null);
        setOperation(null);
        setWaitingForNewValue(true);
        return String(newValue);
      }
      return prev;
    });
  }, [previousValue, operation, calculate]);

  const handleSquareRoot = useCallback(() => {
    setDisplay(prev => {
      const value = parseFloat(prev);
      if (value >= 0) {
        const result = Math.sqrt(value);
        setWaitingForNewValue(true);
        return String(result);
      }
      return prev;
    });
  }, []);

  const handleReciprocal = useCallback(() => {
    setDisplay(prev => {
      const value = parseFloat(prev);
      if (value !== 0) {
        const result = 1 / value;
        setWaitingForNewValue(true);
        return String(result);
      }
      return prev;
    });
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.calculator-close') || e.target.closest('.calc-btn') || e.target.closest('.resize-handle')) {
      return;
    }
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
      } else if (isResizing && resizeHandle) {
      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;
      
      let newWidth = resizeStartPos.current.width;
      let newHeight = resizeStartPos.current.height;
      
      const minWidth = 250;
      const minHeight = 350;
      const maxWidth = window.innerWidth - position.x;
      const maxHeight = window.innerHeight - position.y;
      
      // Handle right edge
      if (resizeHandle === 'right' || resizeHandle === 'both') {
        newWidth = Math.max(minWidth, Math.min(resizeStartPos.current.width + deltaX, maxWidth));
      }
      // Handle bottom edge
      if (resizeHandle === 'bottom' || resizeHandle === 'both') {
        newHeight = Math.max(minHeight, Math.min(resizeStartPos.current.height + deltaY, maxHeight));
      }
      
      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, resizeHandle, position, size]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback((e, handle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };
  }, [size]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <motion.div
      className="calculator-floating"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
      ref={calculatorRef}
    >
      <div
        className="calculator-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <div 
          className="calculator-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <h3>Calculator</h3>
          <button className="calculator-close" onClick={onClose}>✕</button>
        </div>
        
        {/* Resize handles - only right and bottom */}
        <div className="resize-handle resize-handle-right" onMouseDown={(e) => handleResizeStart(e, 'right')}></div>
        <div className="resize-handle resize-handle-bottom" onMouseDown={(e) => handleResizeStart(e, 'bottom')}></div>
        <div className="resize-handle resize-handle-corner" onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
          setResizeHandle('both');
          resizeStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height
          };
        }}></div>
        <div className="calculator-display">
          {display}
        </div>
        <div className="calculator-buttons">
          <button className="calc-btn function" onClick={clear}>C</button>
          <button className="calc-btn function" onClick={handleSquareRoot}>√</button>
          <button className="calc-btn function" onClick={handleReciprocal}>1/x</button>
          <button className="calc-btn operator" onClick={() => performOperation('÷')}>÷</button>
          
          <button className="calc-btn number" onClick={() => inputNumber(7)}>7</button>
          <button className="calc-btn number" onClick={() => inputNumber(8)}>8</button>
          <button className="calc-btn number" onClick={() => inputNumber(9)}>9</button>
          <button className="calc-btn operator" onClick={() => performOperation('×')}>×</button>
          
          <button className="calc-btn number" onClick={() => inputNumber(4)}>4</button>
          <button className="calc-btn number" onClick={() => inputNumber(5)}>5</button>
          <button className="calc-btn number" onClick={() => inputNumber(6)}>6</button>
          <button className="calc-btn operator" onClick={() => performOperation('-')}>-</button>
          
          <button className="calc-btn number" onClick={() => inputNumber(1)}>1</button>
          <button className="calc-btn number" onClick={() => inputNumber(2)}>2</button>
          <button className="calc-btn number" onClick={() => inputNumber(3)}>3</button>
          <button className="calc-btn operator" onClick={() => performOperation('+')}>+</button>
          
          <button className="calc-btn number zero" onClick={() => inputNumber(0)}>0</button>
          <button className="calc-btn number" onClick={inputDecimal}>.</button>
          <button className="calc-btn equals" onClick={handleEquals}>=</button>
        </div>
      </div>
    </motion.div>
  );
});

export default TestInterface;

