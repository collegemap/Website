import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  Sparkles,
  Lock,
  Calendar,
  Zap,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  UserCheck,
  Flame
} from "lucide-react";
import "./JEEDailyTarget.css";

// Use the production API configured for the site before legacy fallbacks.
// The Vercel frontend defines REACT_APP_COLLEGEMAP_API_URL; ignoring it sent
// Daily Target requests to the stale collegemapbackend deployment instead.
const API_BASE_URL = process.env.REACT_APP_COLLEGEMAP_API_URL || process.env.REACT_APP_API_URL || process.env.REACT_APP_URL || 'https://backend-college-map.vercel.app';
const SPREADSHEET_ID = "1xm32z1Gqd5qKpX98wPxj7ToXTjF_9pU6h2CFbZzDx8o";

// Subject Sheet Tab GIDs (Update GIDs here when splitting into separate subject tabs in Google Sheets)
const SHEET_TAB_GIDS = {
  physics: process.env.REACT_APP_SHEET_GID_PHYSICS || "743977408",
  chemistry: process.env.REACT_APP_SHEET_GID_CHEMISTRY || "113602565",
  math: process.env.REACT_APP_SHEET_GID_MATH || "1766363191"
};

const getTabCsvUrl = (gid) => `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

// Fallback questions if both API and Google Sheet fetch fail
const HARDCODED_FALLBACK_QUESTIONS = [
  {
    id: 'q_fb_1',
    subject: 'Physics',
    question: 'A vertical wall is in south-north direction. A current carrying wire is kept in the wall such that to the west of the wall magnetic field due to wire is towards south. Then the wire should be:',
    options: [
      'Vertical and current is downwards',
      'Horizontal and current is towards west',
      'Vertical and current is upwards',
      'Horizontal and current is towards east'
    ],
    correctOption: 0
  },
  {
    id: 'q_fb_2',
    subject: 'Chemistry',
    question: 'The ionisation potential of "X+" ion is equal to:',
    options: [
      'The electron affinity of "X" atom',
      'The electronegativity of "X" atom',
      'The ionisation energy of "X" atom',
      'The electron affinity of "X2+" ion'
    ],
    correctOption: 2
  },
  {
    id: 'q_fb_3',
    subject: 'Mathematics',
    question: 'The mean and standard deviation of 100 observations are 40 and 5.1 respectively. By mistake one observation is taken as 50 instead of 40. If the correct mean and standard deviation are µ and σ respectively, then 100(µ+σ) is equal to:',
    options: ['4490', '3692', '4390', '4400'],
    correctOption: 3
  }
];

// Helper to get IST Date strings
const getISTDateStrings = () => {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  
  const parts = istFormatter.formatToParts(now);
  let month = '', day = '', year = '';
  for (const p of parts) {
    if (p.type === 'month') month = p.value;
    if (p.type === 'day') day = p.value;
    if (p.type === 'year') year = p.value;
  }

  const mPadded = month.padStart(2, '0');
  const dPadded = day.padStart(2, '0');

  const mdYYYY = `${month}/${day}/${year}`;
  const mmddYYYY = `${mPadded}/${dPadded}/${year}`;
  const yyyyMMdd = `${year}-${mPadded}-${dPadded}`;

  const nowInIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const midnightIST = new Date(nowInIST);
  midnightIST.setHours(24, 0, 0, 0);
  const timeRemainingSeconds = Math.max(0, Math.floor((midnightIST.getTime() - nowInIST.getTime()) / 1000));
  const dayOfYear = Math.floor((nowInIST - new Date(nowInIST.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

  return { mdYYYY, mmddYYYY, yyyyMMdd, timeRemainingSeconds, dayOfYear };
};

// Client-side CSV parser
const parseCSVText = (text) => {
  const p = [[]];
  let row = p[0];
  let col = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuote && next === '"') { col += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (c === ',' && !inQuote) {
      row.push(col.trim());
      col = '';
    } else if ((c === '\r' || c === '\n') && !inQuote) {
      if (c === '\r' && next === '\n') { i++; }
      row.push(col.trim());
      col = '';
      row = [];
      p.push(row);
    } else {
      col += c;
    }
  }
  if (col || row.length > 0) {
    row.push(col.trim());
  }
  return p.filter(r => r.length >= 6 && r[1] && r[1].length > 0);
};

// Helper to parse correct option index (0, 1, 2, or 3) from Answer column (r[6])
const parseCorrectOption = (ansRaw, options) => {
  if (ansRaw === null || ansRaw === undefined || ansRaw === '') return 0;
  const ansStr = String(ansRaw).trim();
  if (!ansStr) return 0;

  const ansUpper = ansStr.toUpperCase();

  // 1. Direct exact text match against options
  for (let i = 0; i < options.length; i++) {
    const optText = (options[i] || '').trim();
    if (optText && optText.toLowerCase() === ansStr.toLowerCase()) {
      return i;
    }
  }

  // 2. Cleaned text exact match against options
  const cleanAns = ansStr.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (cleanAns) {
    for (let i = 0; i < options.length; i++) {
      const cleanOpt = (options[i] || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (cleanOpt && cleanOpt === cleanAns) {
        return i;
      }
    }
  }

  // 3. Option letter labels ('A', 'B', 'C', 'D', 'Option A', 'Option A.', etc.)
  if (ansUpper === 'A' || ansUpper.startsWith('OPTION A') || ansUpper.startsWith('OPTIONA') || ansUpper.startsWith('OPT A')) return 0;
  if (ansUpper === 'B' || ansUpper.startsWith('OPTION B') || ansUpper.startsWith('OPTIONB') || ansUpper.startsWith('OPT B')) return 1;
  if (ansUpper === 'C' || ansUpper.startsWith('OPTION C') || ansUpper.startsWith('OPTIONC') || ansUpper.startsWith('OPT C')) return 2;
  if (ansUpper === 'D' || ansUpper.startsWith('OPTION D') || ansUpper.startsWith('OPTIOND') || ansUpper.startsWith('OPT D')) return 3;

  // 4. Index matching ('0', '1', '2', '3')
  if (['0', '1', '2', '3'].includes(ansStr)) {
    return parseInt(ansStr, 10);
  }

  // 5. Substring match fallback (for long text strings)
  if (cleanAns && cleanAns.length >= 4) {
    for (let i = 0; i < options.length; i++) {
      const cleanOpt = (options[i] || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (cleanOpt && (cleanOpt.includes(cleanAns) || cleanAns.includes(cleanOpt))) {
        return i;
      }
    }
  }

  return 0;
};

const JEEDailyTarget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth?.() || {};
  const authUser = auth.user;

  // User state
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Target & Quiz state
  const [loading, setLoading] = useState(true);
  const [targetDate, setTargetDate] = useState("");
  const [dateDisplay, setDateDisplay] = useState("");
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(86400);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [attemptedToday, setAttemptedToday] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Candidate streak state
  const [userStreak, setUserStreak] = useState({
    currentStreak: 0,
    bestStreak: 0,
    totalDaysAttempted: 0,
    totalQuestionsAttempted: 0
  });

  // Leaderboard state
  const [leaderboardTab, setLeaderboardTab] = useState("daily");
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const timerRef = useRef(null);
  const elapsedTimerRef = useRef(null);

  // 1. A daily-target attempt needs a real Supabase Auth session. Browser
  // storage is not authentication and must not unlock the quiz.
  useEffect(() => {
    let isMounted = true;

    const resolveAuthUser = async () => {
      const isValidEmail = (em) => {
        const s = (em || '').trim().toLowerCase();
        return s.length > 3 && s.includes('@') && s !== 'user@collegemap.in';
      };

      // Verify the session with Supabase instead of trusting AuthContext or
      // any value in local/session storage.
      if (supabase) {
        try {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          if (sbUser && isValidEmail(sbUser.email)) {
            const meta = sbUser.user_metadata || {};
            const resolvedName = meta.display_name || meta.name || meta.full_name || sbUser.email.split('@')[0];
            if (isMounted) {
              setUser({
                email: sbUser.email.trim().toLowerCase(),
                name: resolvedName.trim()
              });
              setAuthChecked(true);
            }
            return;
          }
        } catch (e) {
          // ignore error
        }
      }

      // No authenticated user found — never fallback to dummy user@collegemap.in
      if (isMounted) {
        setUser(null);
        setAuthChecked(true);
      }
    };

    resolveAuthUser();

    return () => {
      isMounted = false;
    };
  }, [authUser]);

  // 2. Fetch questions (Express API primary -> Direct Sheet CSV Fallback -> Hardcoded Fallback)
  useEffect(() => {
    if (!authChecked) return;

    const fetchDailyTarget = async () => {
      setLoading(true);
      const userEmail = user?.email || "";
      const dateInfo = getISTDateStrings();
      setTargetDate(dateInfo.yyyyMMdd);
      setDateDisplay(dateInfo.mdYYYY);
      setTimeRemainingSeconds(dateInfo.timeRemainingSeconds);

      let loadedSuccessfully = false;

      // Try Primary Backend API
      try {
        // The email is already part of the query string. Keeping this a simple
        // GET for guests avoids a preflight; signed-in users send their token
        // so the API can safely return only their own submission state.
        const { data: { session } } = userEmail && supabase
          ? await supabase.auth.getSession()
          : { data: { session: null } };
        const headers = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined;
        const res = await fetch(`${API_BASE_URL}/api/daily-target?userEmail=${encodeURIComponent(userEmail)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.questions && data.questions.length > 0) {
            setTargetDate(data.targetDate || dateInfo.yyyyMMdd);
            setDateDisplay(data.dateDisplay || dateInfo.mdYYYY);
            setTimeRemainingSeconds(data.timeRemainingSeconds || dateInfo.timeRemainingSeconds);
            setQuestions(data.questions);

            if (data.userStreak) {
              setUserStreak(data.userStreak);
            }

            if (data.userSubmission) {
              setAttemptedToday(true);
              const sub = data.userSubmission;
              setSubmissionResult({
                score: sub.score ?? sub.total_marks ?? 0,
                correctAnswers: sub.correctAnswers ?? sub.correct_answers ?? 0,
                incorrectAnswers: sub.incorrectAnswers ?? sub.incorrect_answers ?? 0,
                unattempted: sub.unattempted ?? 0,
                accuracy: sub.accuracy ?? sub.percentage ?? 0,
                timeTakenSeconds: sub.timeTakenSeconds ?? sub.time_taken_seconds ?? 0,
                answers: sub.answers || sub.question_details || {}
              });
              if (sub.answers) {
                const ansObj = {};
                Object.keys(sub.answers).forEach(qId => {
                  ansObj[qId] = sub.answers[qId]?.selectedOption !== undefined ? sub.answers[qId].selectedOption : sub.answers[qId];
                });
                setUserAnswers(ansObj);
              }
            }
            loadedSuccessfully = true;
          }
        }
      } catch (err) {
        console.warn("[JEEDailyTarget] Express API unreachable, trying direct Sheet fetch...", err);
      }

      // Fallback 1: Direct Google Sheet CSV fetch client-side
      if (!loadedSuccessfully) {
        try {
          const isMultiTab = (
            SHEET_TAB_GIDS.physics !== SHEET_TAB_GIDS.chemistry ||
            SHEET_TAB_GIDS.physics !== SHEET_TAB_GIDS.math
          );

          const parseSheetRows = (rawRows, defaultSubject = 'Physics') => {
            const dataRows = (rawRows[0][1]?.toLowerCase() === 'question' || rawRows[0][0]?.toLowerCase() === 'subject')
              ? rawRows.slice(1)
              : rawRows;

            return dataRows.map((r, index) => {
              let subjectRaw = (r[0] || '').trim().toLowerCase();
              let subject = defaultSubject;
              if (subjectRaw.includes('chem')) subject = 'Chemistry';
              else if (subjectRaw.includes('math')) subject = 'Mathematics';
              else if (subjectRaw.includes('phys')) subject = 'Physics';

              let questionText = r[1] || '';
              let optionA = r[2] || '';
              let optionB = r[3] || '';
              let optionC = r[4] || '';
              let optionD = r[5] || '';
              let ansRaw = r[6] || '';
              let dateCol1 = r[7] || '';
              let dateCol2 = r[8] || '';

              if (!questionText && r[0] && r[0].length > 15 && r[1] && r[2]) {
                questionText = r[0];
                optionA = r[1];
                optionB = r[2];
                optionC = r[3];
                optionD = r[4];
                ansRaw = r[5] || '';
                dateCol1 = r[6] || '';
                dateCol2 = r[7] || '';
              }

              const options = [optionA, optionB, optionC, optionD];
              const correctOption = parseCorrectOption(ansRaw, options);

              let dateTag = '';
              if (dateCol2 && dateCol2.includes('/')) dateTag = dateCol2.trim();
              else if (dateCol1 && dateCol1.includes('/')) dateTag = dateCol1.trim();

              return {
                id: `${defaultSubject.toLowerCase()}_q_${index + 1}`,
                subject,
                question: questionText,
                options,
                correctOption,
                dateTag
              };
            }).filter(q => q.question && q.options[0]);
          };

          let allQs = [];

          if (isMultiTab) {
            const [physRes, chemRes, mathRes] = await Promise.all([
              fetch(getTabCsvUrl(SHEET_TAB_GIDS.physics)).then(r => r.ok ? r.text() : '').catch(() => ''),
              fetch(getTabCsvUrl(SHEET_TAB_GIDS.chemistry)).then(r => r.ok ? r.text() : '').catch(() => ''),
              fetch(getTabCsvUrl(SHEET_TAB_GIDS.math)).then(r => r.ok ? r.text() : '').catch(() => '')
            ]);

            const physQs = physRes ? parseSheetRows(parseCSVText(physRes), 'Physics') : [];
            const chemQs = chemRes ? parseSheetRows(parseCSVText(chemRes), 'Chemistry') : [];
            const mathQs = mathRes ? parseSheetRows(parseCSVText(mathRes), 'Mathematics') : [];

            allQs = [...physQs, ...chemQs, ...mathQs];
          } else {
            const sheetRes = await fetch(getTabCsvUrl(SHEET_TAB_GIDS.physics));
            if (sheetRes.ok) {
              const csvText = await sheetRes.text();
              allQs = parseSheetRows(parseCSVText(csvText), 'Physics');
            }
          }

          if (allQs.length > 0) {

            const pPool = allQs.filter(q => q.subject === 'Physics');
            const cPool = allQs.filter(q => q.subject === 'Chemistry');
            const mPool = allQs.filter(q => q.subject === 'Mathematics');

            const pick = (pool, seedOffset) => {
              if (!pool.length) return null;
              const matched = pool.find(q => q.dateTag === dateInfo.mdYYYY || q.dateTag === dateInfo.mmddYYYY);
              if (matched) return matched;
              return pool[(dateInfo.dayOfYear + seedOffset) % pool.length];
            };

            const selected = [
              pick(pPool, 1) || HARDCODED_FALLBACK_QUESTIONS[0],
              pick(cPool, 2) || HARDCODED_FALLBACK_QUESTIONS[1],
              pick(mPool, 3) || HARDCODED_FALLBACK_QUESTIONS[2]
            ];

            setQuestions(selected.map(q => ({ id: q.id, subject: q.subject, question: q.question, options: q.options })));

            loadedSuccessfully = true;
          }
        } catch (csvErr) {
          console.warn("[JEEDailyTarget] Direct Sheet CSV fetch error, using hardcoded questions...", csvErr);
        }
      }

      // Fallback 2: Hardcoded fallback questions
      if (!loadedSuccessfully) {
        setQuestions(HARDCODED_FALLBACK_QUESTIONS.map(q => ({ id: q.id, subject: q.subject, question: q.question, options: q.options })));
      }

      setLoading(false);
    };

    fetchDailyTarget();
  }, [authChecked, user]);

  // 3. Countdown timer until midnight IST
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds(prev => (prev > 0 ? prev - 1 : 86400));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // 4. Time elapsed stopwatch for quiz attempt
  useEffect(() => {
    if (!attemptedToday && user && !loading) {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(elapsedTimerRef.current);
    }

    return () => clearInterval(elapsedTimerRef.current);
  }, [attemptedToday, user, loading]);

  // 5. Fetch Leaderboard (Express API -> Supabase Fallback)
  const fetchLeaderboard = async (type = leaderboardTab) => {
    setLeaderboardLoading(true);
    try {
      const userEmail = user?.email || "";
      let fetched = false;

      // Try Express API first
      try {
        // `userEmail` is supplied above, so do not send a custom header that
        // forces a CORS preflight on the public API.
        const res = await fetch(`${API_BASE_URL}/api/leaderboard?type=${type}&userEmail=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLeaderboard(data.leaderboard || []);
            setCurrentUserRank(data.currentUserRank || null);
            if (data.currentUserRank) {
              setUserStreak(prev => ({
                currentStreak: data.currentUserRank.streak || prev.currentStreak || 1,
                bestStreak: data.currentUserRank.bestStreak || prev.bestStreak || data.currentUserRank.streak || 1,
                totalDaysAttempted: data.currentUserRank.totalDaysAttempted || prev.totalDaysAttempted || 1,
                totalQuestionsAttempted: data.currentUserRank.totalQuestionsAttempted || prev.totalQuestionsAttempted || 3
              }));
            }
            fetched = true;
          }
        }
      } catch (err) {
        console.warn("[Leaderboard] Express API unreachable, trying Supabase direct...", err);
      }

      // Submission data is intentionally not read directly from Supabase in
      // the browser; its RLS policy only permits the authenticated API.
      if (!fetched) {
        setLeaderboard([]);
        setCurrentUserRank(null);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(leaderboardTab);
  }, [leaderboardTab, user]);

  // Format seconds into HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format elapsed time MM:SS (guards against NaN/undefined)
  const formatElapsed = (seconds) => {
    const s = Math.max(0, parseInt(seconds, 10) || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle Option selection
  const handleOptionSelect = (qId, optionIdx) => {
    if (attemptedToday) return;
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optionIdx === prev[qId] ? null : optionIdx
    }));
  };

  // Submit Target handler
  const handleSubmit = async () => {
    if (!user || !user.email || attemptedToday) return;

    if (user.email.toLowerCase() === 'user@collegemap.in') {
      alert("Please sign in with your student account before submitting.");
      navigate("/login?redirect=/jee-daily-target");
      return;
    }

    const answeredCount = Object.values(userAnswers).filter(val => val !== null && val !== undefined).length;
    if (answeredCount < questions.length) {
      const confirm = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);
    try {
      if (!supabase) {
        throw new Error("Daily target sign-in is temporarily unavailable. Please try again later.");
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !session.user?.email || session.user.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
        alert("Your login session has expired. Please sign in again to submit your target.");
        setUser(null);
        navigate("/login?redirect=/jee-daily-target");
        return;
      }

      const cleanEmail = user.email.trim().toLowerCase();
      const cleanName = (user.name || cleanEmail.split("@")[0] || 'Student').trim();

      const payload = {
        userEmail: cleanEmail,
        userName: cleanName,
        answers: userAnswers,
        timeTakenSeconds: elapsedSeconds
      };

      let submittedOk = false;

      // 1. Try Express API submit (if backend endpoint is available)
      try {
        const res = await fetch(`${API_BASE_URL}/api/daily-target/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAttemptedToday(true);
            setSubmissionResult({
              score: data.score,
              correctAnswers: data.correctAnswers,
              incorrectAnswers: data.incorrectAnswers,
              unattempted: data.unattempted,
              accuracy: data.accuracy,
              timeTakenSeconds: data.timeTakenSeconds,
              answers: data.feedback
            });
            submittedOk = true;

          }
        } else if (res.status === 409) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "You have already submitted today's target.");
          setAttemptedToday(true);
          submittedOk = true;
        } else {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "The daily target service could not save your submission.");
        }
      } catch (apiErr) {
        console.warn("[Submit] Daily target API request failed:", apiErr);
        throw apiErr;
      }

      // Scores are calculated and persisted only by the authenticated API.
      // A direct browser write is both insecure and rejected by Supabase RLS.
      if (!submittedOk) {
        throw new Error("Unable to save your submission to the shared leaderboard. Please try again.");
      }

      await fetchLeaderboard(leaderboardTab);
    } catch (err) {
      console.error("Error submitting daily target:", err);
      alert(err.message || "Submission encountered an error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubjectColor = (subject) => {
    switch (subject?.toLowerCase()) {
      case "physics":
        return { badgeClass: "subj-physics", icon: "⚛️" };
      case "chemistry":
        return { badgeClass: "subj-chem", icon: "🧪" };
      case "mathematics":
      case "maths":
      case "math":
        return { badgeClass: "subj-math", icon: "📐" };
      default:
        return { badgeClass: "subj-default", icon: "📝" };
    }
  };

  return (
    <main className="jee-daily-target-page">
      <Helmet>
        <title>JEE Daily Target & Leaderboard | CollegeMap</title>
        <meta
          name="description"
          content="Attempt today's 3 fresh JEE target questions (Physics, Chemistry, Math), get instant marking (+4/-1), and climb the Daily, Weekly, and Monthly Leaderboards."
        />
        <link rel="canonical" href="https://collegemap.in/jee-daily-target" />
      </Helmet>

      {/* Hero Header */}
      <section className="jdt-hero">
        <div className="jdt-hero-overlay"></div>
        <div className="jdt-container jdt-hero-content">
          <div className="jdt-badge-wrapper">
            <span className="jdt-live-pill">
              <span className="jdt-pulse-dot"></span> LIVE FOR TODAY {dateDisplay ? `(${dateDisplay})` : ''}
            </span>
            <span className="jdt-subject-tag">Physics • Chemistry • Mathematics</span>
          </div>

          <h1 className="jdt-title">
            JEE <span className="jdt-gradient-text">Daily Target</span> & Leaderboard
          </h1>
          <p className="jdt-subtitle">
            3 High-Yield Questions • JEE Standard Marking (+4 / -1) • Instant Analytics & Global Standings
          </p>

          {/* Countdown Card */}
          <div className="jdt-timer-card">
            <div className="jdt-timer-label">
              <Clock className="jdt-clock-icon" />
              <span>Target Resets In (IST):</span>
            </div>
            <div className="jdt-countdown">
              {formatTime(timeRemainingSeconds)}
            </div>
          </div>
        </div>
      </section>

      <div className="jdt-container jdt-main-body">
        {/* Authentication Gate if user is NOT logged in */}
        {!user && authChecked && (
          <section className="jdt-auth-gate">
            <div className="jdt-auth-card">
              <div className="jdt-lock-circle">
                <Lock className="jdt-lock-icon" />
              </div>
              <h2>Signed-in Access Only</h2>
              <p>
                To attempt today's target, record your accuracy, and secure your place on the JEE Daily Leaderboard, please sign in to your CollegeMap account.
              </p>
              <div className="jdt-auth-actions">
                <button
                  className="jdt-btn-primary"
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                >
                  <UserCheck className="jdt-btn-icon" /> Sign In to Attempt Target
                </button>
              </div>
              <div className="jdt-auth-perks">
                <div className="jdt-perk">✨ 3 Daily Questions</div>
                <div className="jdt-perk">⚡ Instant Score (+4 / -1)</div>
                <div className="jdt-perk">🏆 Daily, Weekly & Monthly Leaderboards</div>
                <div className="jdt-perk">🔥 Candidate Streak Badges</div>
              </div>
            </div>
          </section>
        )}

        <div className="jdt-layout-grid">
          {/* LEFT COLUMN: Practice Target Quiz & Results */}
          <div className="jdt-left-column">
            {user && (
              <section className="jdt-quiz-section">
                <div className="jdt-section-header">
                  <div>
                    <h2 className="jdt-section-title">
                      <Zap className="jdt-zap-icon" /> Today's Practice Target
                    </h2>
                    <p className="jdt-section-desc">
                      Select your options below. Click "Submit Target" when ready.
                    </p>
                  </div>

                  {!attemptedToday && (
                    <div className="jdt-stopwatch">
                      <Clock size={16} />
                      <span>Time Elapsed: <strong>{formatElapsed(elapsedSeconds)}</strong></span>
                    </div>
                  )}

                  {attemptedToday && (
                    <div className="jdt-completed-tag">
                      <CheckCircle2 size={18} />
                      <span>Target Completed Today</span>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="jdt-loading-state">
                    <RefreshCw className="jdt-spin-icon" size={32} />
                    <p>Loading today's questions from Question Bank...</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="jdt-empty-state">
                    <AlertCircle size={36} />
                    <p>Loading questions... If questions do not appear, please refresh.</p>
                  </div>
                ) : (
                  <div className="jdt-questions-list">
                    {questions.map((q, idx) => {
                      const subjMeta = getSubjectColor(q.subject);
                      const selectedOpt = userAnswers[q.id];
                      const feedbackItem = submissionResult?.answers ? submissionResult.answers[q.id] : null;

                      return (
                        <div key={q.id} className="jdt-question-card">
                          <div className="jdt-q-header">
                            <span className={`jdt-q-subject ${subjMeta.badgeClass}`}>
                              {subjMeta.icon} {q.subject}
                            </span>
                            <span className="jdt-q-number">Question {idx + 1} of {questions.length}</span>
                          </div>

                          <div className="jdt-q-text">{q.question}</div>

                          <div className="jdt-options-grid">
                            {q.options.map((opt, optIdx) => {
                              let optClass = "jdt-option-card";
                              if (selectedOpt === optIdx) {
                                optClass += " selected";
                              }

                              if (attemptedToday && feedbackItem) {
                                if (feedbackItem.correctOption === optIdx) {
                                  optClass += " is-correct";
                                } else if (selectedOpt === optIdx && feedbackItem.status === "incorrect") {
                                  optClass += " is-incorrect";
                                } else {
                                  optClass += " is-dimmed";
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  className={optClass}
                                  onClick={() => handleOptionSelect(q.id, optIdx)}
                                  disabled={attemptedToday}
                                >
                                  <span className="jdt-opt-letter">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="jdt-opt-text">{opt}</span>

                                  {attemptedToday && feedbackItem?.correctOption === optIdx && (
                                    <CheckCircle2 className="jdt-opt-result-icon correct" size={18} />
                                  )}
                                  {attemptedToday && selectedOpt === optIdx && feedbackItem?.status === "incorrect" && (
                                    <XCircle className="jdt-opt-result-icon incorrect" size={18} />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {attemptedToday && feedbackItem && (
                            <div className={`jdt-feedback-box ${feedbackItem.status}`}>
                              {feedbackItem.status === "correct" && (
                                <div className="jdt-fb-msg success">
                                  <CheckCircle2 size={16} /> <strong>Correct!</strong> +4 Marks
                                </div>
                              )}
                              {feedbackItem.status === "incorrect" && (
                                <div className="jdt-fb-msg danger">
                                  <XCircle size={16} /> <strong>Incorrect.</strong> -1 Mark (Correct Answer: Option {String.fromCharCode(65 + feedbackItem.correctOption)})
                                </div>
                              )}
                              {feedbackItem.status === "unattempted" && (
                                <div className="jdt-fb-msg warning">
                                  <AlertCircle size={16} /> <strong>Unattempted.</strong> 0 Marks (Correct Answer: Option {String.fromCharCode(65 + feedbackItem.correctOption)})
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {!attemptedToday && (
                      <div className="jdt-submit-bar">
                        <div className="jdt-submit-info">
                          <span>Answered: <strong>{Object.values(userAnswers).filter(v => v !== null && v !== undefined).length} / {questions.length}</strong></span>
                          <span className="jdt-marking-pill">Scheme: +4 Correct | -1 Wrong | 0 Skip</span>
                        </div>

                        <button
                          className="jdt-submit-btn"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="jdt-spin-icon" size={18} /> Submitting...
                            </>
                          ) : (
                            <>
                              Submit Target <ChevronRight size={18} />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {attemptedToday && submissionResult && (
                  <div className="jdt-result-summary-card">
                    <div className="jdt-result-header">
                      <Award className="jdt-trophy-icon" size={28} />
                      <div>
                        <h3>Target Result for Today</h3>
                        <p>Great effort! Your score has been logged to the leaderboard.</p>
                      </div>
                    </div>

                    <div className="jdt-metrics-grid">
                      <div className="jdt-metric-card score">
                        <div className="jdt-metric-val">{submissionResult.score ?? submissionResult.total_marks ?? 0} / 12</div>
                        <div className="jdt-metric-lbl">Total Score</div>
                      </div>

                      <div className="jdt-metric-card accuracy">
                        <div className="jdt-metric-val">{submissionResult.accuracy ?? submissionResult.percentage ?? 0}%</div>
                        <div className="jdt-metric-lbl">Accuracy</div>
                      </div>

                      <div className="jdt-metric-card time">
                        <div className="jdt-metric-val">{formatElapsed(submissionResult.timeTakenSeconds ?? submissionResult.time_taken_seconds ?? 0)}</div>
                        <div className="jdt-metric-lbl">Time Taken</div>
                      </div>

                      <div className="jdt-metric-card breakdown">
                        <div className="jdt-breakdown-row">
                          <span className="dot correct"></span> Correct: <strong>{submissionResult.correctAnswers ?? submissionResult.correct_answers ?? 0}</strong>
                        </div>
                        <div className="jdt-breakdown-row">
                          <span className="dot incorrect"></span> Incorrect: <strong>{submissionResult.incorrectAnswers ?? submissionResult.incorrect_answers ?? 0}</strong>
                        </div>
                        <div className="jdt-breakdown-row">
                          <span className="dot unattempted"></span> Skipped: <strong>{submissionResult.unattempted ?? 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* RIGHT COLUMN SIDEBAR: Candidate Streak & Live Leaderboard */}
          <aside className="jdt-right-column">
            {/* Candidate Streak Banner Card */}
            {user && (
              <div className="jdt-streak-card">
                <div className="jdt-streak-header">
                  <div className="jdt-flame-icon-box">
                    <Flame className="jdt-flame-icon" size={26} />
                  </div>
                  <div>
                    <h3 className="jdt-streak-title">Your Target Streak & Activity</h3>
                    <p className="jdt-streak-subtitle">Consistency is key to cracking JEE Mains & Advanced</p>
                  </div>
                </div>

                <div className="jdt-streak-metrics-grid">
                  <div className="jdt-streak-stat-box highlight">
                    <span className="jdt-streak-num">🔥 {Math.max(currentUserRank?.streak || 0, userStreak.currentStreak || 0, attemptedToday ? 1 : 0)} Days</span>
                    <span className="jdt-streak-lbl">Active Streak</span>
                  </div>
                  <div className="jdt-streak-stat-box">
                    <span className="jdt-streak-num">🏆 {Math.max(currentUserRank?.bestStreak || 0, userStreak.bestStreak || 0, currentUserRank?.streak || 0, userStreak.currentStreak || 0, attemptedToday ? 1 : 0)} Days</span>
                    <span className="jdt-streak-lbl">Best Streak</span>
                  </div>
                  <div className="jdt-streak-stat-box">
                    <span className="jdt-streak-num">📅 {Math.max(currentUserRank?.totalDaysAttempted || 0, userStreak.totalDaysAttempted || 0, attemptedToday ? 1 : 0)}</span>
                    <span className="jdt-streak-lbl">Days Attempted</span>
                  </div>
                  <div className="jdt-streak-stat-box">
                    <span className="jdt-streak-num">📝 {Math.max(currentUserRank?.totalQuestionsAttempted || 0, userStreak.totalQuestionsAttempted || 0, attemptedToday ? (questions.length || 3) : 0)}</span>
                    <span className="jdt-streak-lbl">Questions Solved</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar Leaderboard Section */}
            <section className="jdt-leaderboard-section">
              <div className="jdt-lb-header">
                <div>
                  <h2 className="jdt-section-title">
                    <Trophy className="jdt-trophy-gold" size={20} /> Live Leaderboard
                  </h2>
                  <p className="jdt-section-desc">
                    Rankings & Candidate Streaks
                  </p>
                </div>

                <div className="jdt-lb-tabs">
                  <button
                    className={`jdt-tab-btn ${leaderboardTab === "daily" ? "active" : ""}`}
                    onClick={() => setLeaderboardTab("daily")}
                  >
                    <Calendar size={13} /> Daily
                  </button>
                  <button
                    className={`jdt-tab-btn ${leaderboardTab === "weekly" ? "active" : ""}`}
                    onClick={() => setLeaderboardTab("weekly")}
                  >
                    <Sparkles size={13} /> Weekly
                  </button>
                  <button
                    className={`jdt-tab-btn ${leaderboardTab === "monthly" ? "active" : ""}`}
                    onClick={() => setLeaderboardTab("monthly")}
                  >
                    <Trophy size={13} /> Monthly
                  </button>
                </div>
              </div>

              {user && currentUserRank && (
                <div className="jdt-user-rank-banner">
                  <div className="jdt-user-rank-info">
                    <span className="jdt-user-rank-badge">Your Rank: #{currentUserRank.rank}</span>
                    <span className="jdt-user-name-text"><strong>{currentUserRank.user_name || currentUserRank.name || user.name || "You"}</strong></span>
                  </div>
                  <div className="jdt-user-rank-stats">
                    <span>Score: <strong>{currentUserRank.score ?? currentUserRank.total_marks ?? 0} pts</strong></span>
                    <span>Streak: <strong>🔥 {currentUserRank.streak || userStreak.currentStreak || 1}d</strong></span>
                  </div>
                </div>
              )}

              <div className="jdt-table-wrapper">
                {leaderboardLoading ? (
                  <div className="jdt-table-loading">
                    <RefreshCw className="jdt-spin-icon" size={24} />
                    <p>Updating rankings...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="jdt-table-empty">
                    <HelpCircle size={28} />
                    <p>No submissions yet for this period. Be the first to submit!</p>
                  </div>
                ) : (
                  <table className="jdt-lb-table">
                    <thead>
                      <tr>
                        <th className="jdt-col-rank">Rank</th>
                        <th className="jdt-col-name">Student</th>
                        <th className="jdt-col-streak">Streak</th>
                        <th className="jdt-col-score">Score</th>
                        <th className="jdt-col-accuracy">Acc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((row) => {
                        const rowEmail = (row.user_email || row.email || "").toLowerCase();
                        const isCurrentUser = user && rowEmail === user.email?.toLowerCase();
                        const studentName = row.user_name || row.name || (rowEmail ? rowEmail.split('@')[0] : "Student");
                        const accuracyVal = row.accuracy ?? row.percentage ?? 0;
                        let rankBadge = null;
                        let rankRowClass = isCurrentUser ? "jdt-row-current" : "";

                        if (row.rank === 1) {
                          rankBadge = <span className="jdt-medal gold">🥇 1st</span>;
                          rankRowClass += " jdt-row-gold";
                        } else if (row.rank === 2) {
                          rankBadge = <span className="jdt-medal silver">🥈 2nd</span>;
                          rankRowClass += " jdt-row-silver";
                        } else if (row.rank === 3) {
                          rankBadge = <span className="jdt-medal bronze">🥉 3rd</span>;
                          rankRowClass += " jdt-row-bronze";
                        } else {
                          rankBadge = <span className="jdt-rank-num">#{row.rank}</span>;
                        }

                        return (
                          <tr key={row.rank || row.id || rowEmail} className={rankRowClass}>
                            <td className="jdt-col-rank">{rankBadge}</td>
                            <td className="jdt-col-name">
                              <div className="jdt-name-cell">
                                <span className="jdt-student-name" title={studentName}>{studentName}</span>
                                {isCurrentUser && <span className="jdt-you-pill">YOU</span>}
                              </div>
                            </td>
                            <td className="jdt-col-streak">
                              <span className="jdt-streak-pill">🔥 {row.streak || 1}d</span>
                            </td>
                            <td className="jdt-col-score">
                              <strong className="jdt-score-text">{row.score ?? row.total_marks ?? 0} pts</strong>
                            </td>
                            <td className="jdt-col-accuracy">{accuracyVal}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default JEEDailyTarget;
