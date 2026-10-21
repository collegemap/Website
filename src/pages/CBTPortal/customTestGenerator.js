/**
 * Custom Test Generator
 * 
 * Pools questions from ALL available test papers (2022, 2023, 2024, 2025, 2026)
 * and generates custom tests based on student-selected filters:
 * - Subject(s)
 * - Lesson/Topic(s)
 * - Difficulty level(s)
 * - Number of questions
 */

// Registry of all available test papers with metadata
const TEST_REGISTRY = [
  // 2026 tests - 21-jan use capitalized folders; 22-jan through 28th use lowercase (Linux case-sensitive)
  {
    folder: 'jee-main-2026-21-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  {
    folder: 'jee-main-2026-21-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  {
    folder: 'jee-main-2026-22-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2026-22-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2026-23-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2026-23rd-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2026-24th-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2026-24th-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2026-28th-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2026-28th-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  // 2025 tests
  {
    folder: 'jee-main-2025-22-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  {
    folder: 'jee-main-2025-22-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  {
    folder: 'jee-main-2025-23rd-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  {
    folder: 'jee-main-2025-24th-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  {
    folder: 'jee-main-2025-28th-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  {
    folder: 'jee-main-2025-28th-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  {
    folder: 'jee-main-2025-29th-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  {
    folder: 'jee-main-2025-29th-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Maths' }
  },
  // 2024 Session 1 (January / February) tests
  {
    folder: 'jee-main-2024-27th-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-27th-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-29th-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-29th-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-30th-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-30th-jan-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-31st-jan-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-1st-feb-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-1st-feb-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  // 2024 Session 2 (April) tests
  {
    folder: 'jee-main-2024-4th-apr-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-4th-apr-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-5th-apr-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-5th-apr-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-6th-apr-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-6th-apr-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-8th-apr-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-8th-apr-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-9th-apr-shift-1',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  },
  {
    folder: 'jee-main-2024-9th-apr-shift-2',
    hasAnswerKey: true,
    subjectFolders: { physics: 'physics', chemistry: 'chemistry', mathematics: 'maths' }
  }
];

// Registry of Question Bank chapters (chapter-wise practice questions)
const QUESTION_BANK_REGISTRY = [
  // Physics chapters
  { folder: 'Atoms-and-Nuclei', chapterId: 'atoms-and-nuclei', chapterName: 'Atoms and Nuclei', subject: 'physics' },
  { folder: 'Current-Electricity', chapterId: 'current-electricity', chapterName: 'Current Electricity', subject: 'physics' },
  { folder: 'Dual-Nature-of-Matter-and-Radiation', chapterId: 'dual-nature-of-matter-and-radiation', chapterName: 'Dual Nature of Matter and Radiation', subject: 'physics' },
  { folder: 'Electromagnetic-Induction-and-Alternating-Currents', chapterId: 'electromagnetic-induction-and-alternating-currents', chapterName: 'Electromagnetic Induction and Alternating Currents', subject: 'physics' },
  { folder: 'Electromagnetic-Waves', chapterId: 'electromagnetic-waves', chapterName: 'Electromagnetic Waves', subject: 'physics' },
  { folder: 'Electronic-Devices', chapterId: 'electronic-devices', chapterName: 'Electronic Devices', subject: 'physics' },
  { folder: 'Electrostatics', chapterId: 'electrostatics', chapterName: 'Electrostatics', subject: 'physics' },
  { folder: 'Experimental-Skills', chapterId: 'experimental-skills', chapterName: 'Experimental Skills', subject: 'physics' },
  { folder: 'Gravitation', chapterId: 'gravitation', chapterName: 'Gravitation', subject: 'physics' },
  { folder: 'Kinemtaics', chapterId: 'kinemtaics', chapterName: 'Kinematics', subject: 'physics' },
  { folder: 'Kinetic-Theory-of-Gases', chapterId: 'kinetic-theory-of-gases', chapterName: 'Kinetic Theory of Gases', subject: 'physics' },
  { folder: 'Laws-of-Motion', chapterId: 'laws-of-motion', chapterName: 'Laws of Motion', subject: 'physics' },
  { folder: 'Magnetic-Effects-of-Current-and-Magnetism', chapterId: 'magnetic-effects-of-current-and-magnetism', chapterName: 'Magnetic Effects of Current and Magnetism', subject: 'physics' },
  { folder: 'Optics', chapterId: 'optics', chapterName: 'Optics', subject: 'physics' },
  { folder: 'Oscillations-and-Waves', chapterId: 'oscillations-and-waves', chapterName: 'Oscillations and Waves', subject: 'physics' },
  { folder: 'Properties-of-Solids-and-Liquids', chapterId: 'properties-of-solids-and-liquids', chapterName: 'Properties of Solids and Liquids', subject: 'physics' },
  { folder: 'Rotational-Motion', chapterId: 'rotational-motion', chapterName: 'Rotational Motion', subject: 'physics' },
  { folder: 'Thermodynamics', chapterId: 'thermodynamics', chapterName: 'Thermodynamics', subject: 'physics' },
  { folder: 'Units-and-Measurements', chapterId: 'units-and-measurements', chapterName: 'Units and Measurements', subject: 'physics' },
  { folder: 'Work,-Energy-and-Power', chapterId: 'work,-energy-and-power', chapterName: 'Work, Energy and Power', subject: 'physics' },
  // Chemistry chapters
  { folder: 'Atomic-Structure', chapterId: 'atomic-structure', chapterName: 'Atomic Structure', subject: 'chemistry' },
  { folder: 'Biomolecules', chapterId: 'biomolecules', chapterName: 'Biomolecules', subject: 'chemistry' },
  { folder: 'Chemical-Kinetics', chapterId: 'chemical-kinetics', chapterName: 'Chemical Kinetics', subject: 'chemistry' },
  { folder: 'Chemical-Bonding-and-Molecular-Structure', chapterId: 'chemical-bonding-and-molecular-structure', chapterName: 'Chemical Bonding and Molecular Structure', subject: 'chemistry' },
  { folder: 'Chemical-Thermodynamics', chapterId: 'chemical-thermodynamics', chapterName: 'Chemical Thermodynamics', subject: 'chemistry' },
  { folder: 'Classification-of-Elements-and-Periodicity-in-Properties', chapterId: 'classification-of-elements-and-periodicity-in-properties', chapterName: 'Classification of Elements and Periodicity in Properties', subject: 'chemistry' },
  { folder: 'Coordination-Compounds', chapterId: 'coordination-compounds', chapterName: 'Coordination Compounds', subject: 'chemistry' },
  { folder: 'd--and-f-Block-Elements', chapterId: 'd--and-f-block-elements', chapterName: 'd- and f-Block Elements', subject: 'chemistry' },
  { folder: 'Equilibrium', chapterId: 'equilibrium', chapterName: 'Equilibrium', subject: 'chemistry' },
  { folder: 'Hydrocarbons', chapterId: 'hydrocarbons', chapterName: 'Hydrocarbons', subject: 'chemistry' },
  { folder: 'Organic-Compounds-Containing-Halogens', chapterId: 'organic-compounds-containing-halogens', chapterName: 'Organic Compounds Containing Halogens', subject: 'chemistry' },
  { folder: 'Organic-Compounds-Containing-Nitrogen', chapterId: 'organic-compounds-containing-nitrogen', chapterName: 'Organic Compounds Containing Nitrogen', subject: 'chemistry' },
  { folder: 'Organic-Compounds-Containing-Oxygen', chapterId: 'organic-compounds-containing-oxygen', chapterName: 'Organic Compounds Containing Oxygen', subject: 'chemistry' },
  { folder: 'p-Block-Elements', chapterId: 'p-block-elements', chapterName: 'p-Block Elements', subject: 'chemistry' },
  { folder: 'Principles-Related-to-Practical-Chemistry', chapterId: 'principles-related-to-practical-chemistry', chapterName: 'Principles Related to Practical Chemistry', subject: 'chemistry' },
  { folder: 'Purification-and-Characterisation-of-Organic-Compounds', chapterId: 'purification-and-characterisation-of-organic-compounds', chapterName: 'Purification and Characterisation of Organic Compounds', subject: 'chemistry' },
  { folder: 'Redox-Reactions-and-Electrochemistry', chapterId: 'redox-reactions-and-electrochemistry', chapterName: 'Redox Reactions and Electrochemistry', subject: 'chemistry' },
  { folder: 'Solutions', chapterId: 'solutions', chapterName: 'Solutions', subject: 'chemistry' },
  { folder: 'Some-Basic-Principles-of-Organic-Chemistry', chapterId: 'some-basic-principles-of-organic-chemistry', chapterName: 'Some Basic Principles of Organic Chemistry', subject: 'chemistry' },
  { folder: 'Some-Basic-Concepts-in-Chemistry', chapterId: 'some-basic-concepts-in-chemistry', chapterName: 'Some Basic Concepts in Chemistry', subject: 'chemistry' },
  // Mathematics chapters
  { folder: 'Binomial-Theorem-and-Its-Simple-Applications', chapterId: 'binomial-theorem-and-its-simple-applications', chapterName: 'Binomial Theorem and Its Simple Applications', subject: 'mathematics' },
  { folder: 'Co-ordinate-Geometry', chapterId: 'co-ordinate-geometry', chapterName: 'Co-ordinate Geometry', subject: 'mathematics' },
  { folder: 'Complex-Numbers-and-Quadratic-Equations', chapterId: 'complex-numbers-and-quadratic-equations', chapterName: 'Complex Numbers and Quadratic Equations', subject: 'mathematics' },
  { folder: 'Differential-Equations', chapterId: 'differential-equations', chapterName: 'Differential Equations', subject: 'mathematics' },
  { folder: 'Integral-Calculus', chapterId: 'integral-calculus', chapterName: 'Integral Calculus', subject: 'mathematics' },
  { folder: 'Limit,-Continuity-and-Differentiability', chapterId: 'limit,-continuity-and-differentiability', chapterName: 'Limit, Continuity and Differentiability', subject: 'mathematics' },
  { folder: 'Matrices-and-Determinants', chapterId: 'matrices-and-determinants', chapterName: 'Matrices and Determinants', subject: 'mathematics' },
  { folder: 'Permutations-and-Combinations', chapterId: 'permutations-and-combinations', chapterName: 'Permutations and Combinations', subject: 'mathematics' },
  { folder: 'Sequence-and-Series', chapterId: 'sequence-and-series', chapterName: 'Sequence and Series', subject: 'mathematics' },
  { folder: 'Sets,-Relations-and-Functions', chapterId: 'sets,-relations-and-functions', chapterName: 'Sets, Relations and Functions', subject: 'mathematics' },
  { folder: 'Statistics-and-Probability', chapterId: 'statistics-and-probability', chapterName: 'Statistics and Probability', subject: 'mathematics' },
  { folder: 'Three-Dimensional-Geometry', chapterId: 'three-dimensional-geometry', chapterName: 'Three Dimensional Geometry', subject: 'mathematics' },
  { folder: 'Trigonometry', chapterId: 'trigonometry', chapterName: 'Trigonometry', subject: 'mathematics' },
  { folder: 'Vector-Algebra', chapterId: 'vector-algebra', chapterName: 'Vector Algebra', subject: 'mathematics' },
];

// Cache for loaded metadata
let metadataCache = {};
let answerKeyCache = {};
let questionBankCache = {};

/**
 * Load the difficulty/lesson metadata JSON for a test folder
 */
const loadTestMetadataJSON = async (testFolder) => {
  if (metadataCache[testFolder]) return metadataCache[testFolder];

  // Build candidate JSON filenames to try (kebab-case, underscore variant, and space→hyphen variant)
  const underscoreVariant = testFolder.replace(/-/g, '_');
  const possibleNames = [
    `${testFolder}/${testFolder}.json`,
    `${testFolder}/${underscoreVariant}.json`,
    // Capitalised variant (e.g. JEE_Main_2024_8th_Apr_Shift_1.json)
    `${testFolder}/${underscoreVariant.replace(/(^|_)(\w)/g, (_, sep, c) => sep + c.toUpperCase())}.json`,
    // For folders with spaces, the JSON file uses hyphenated names
    `${testFolder}/${testFolder.toLowerCase().replace(/[() ]+/g, '-').replace(/-+/g, '-').replace(/-$/, '')}.json`
  ];

  for (const path of possibleNames) {
    try {
      const response = await fetch(`/tests/${encodeURI(path)}`);
      if (response.ok) {
        const text = await response.text();
        if (text.trim().startsWith('<')) continue; // CRA returns HTML for 404
        const data = JSON.parse(text);
        metadataCache[testFolder] = data;
        return data;
      }
    } catch (e) {
      // Try next path
    }
  }

  return null;
};

/**
 * Load answer key for tests that have one
 */
const loadAnswerKeyForTest = async (testFolder) => {
  if (answerKeyCache[testFolder]) return answerKeyCache[testFolder];

  try {
    const response = await fetch(`/tests/${testFolder}/answerKey.json`);
    if (response.ok) {
      const data = await response.json();
      answerKeyCache[testFolder] = data;
      return data;
    }
  } catch (e) {
    // No answer key
  }
  return null;
};

/**
 * Load a Question Bank chapter and return question objects.
 * Each chapter has an answer key JSON and difficulty folders with question images.
 */
const loadQuestionBankChapter = async (chapterInfo) => {
  if (questionBankCache[chapterInfo.chapterId]) {
    return questionBankCache[chapterInfo.chapterId];
  }

  const questions = [];

  try {
    // Build the URL path using standard path mapping
    const answerKeyPath = `/QUESTION_BANK/${chapterInfo.folder}/${chapterInfo.chapterId}-answer-key.json`;

    const response = await fetch(answerKeyPath);

    if (!response.ok) {
      console.warn(`[QB Debug] HTTP ${response.status} for ${chapterInfo.chapterName}: ${answerKeyPath}`);
      return questions;
    }

    // CRA dev server returns index.html (200 OK) for non-existent static files
    const responseText = await response.text();

    if (responseText.trim().startsWith('<')) {
      console.warn(`[QB Debug] Got HTML instead of JSON for ${chapterInfo.chapterName} — file not found at: ${answerKeyPath}`);
      return questions;
    }

    let answerKeyData;
    try {
      answerKeyData = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn(`[QB Debug] JSON parse error for ${chapterInfo.chapterName}:`, parseErr.message);
      return questions;
    }

    const normalizedSubject = chapterInfo.subject;
    const subjectDisplayName = normalizedSubject === 'mathematics' ? 'Mathematics' :
      normalizedSubject.charAt(0).toUpperCase() + normalizedSubject.slice(1);

    // Process each difficulty level
    if (answerKeyData.difficulties && Array.isArray(answerKeyData.difficulties)) {
      for (const difficultyGroup of answerKeyData.difficulties) {
        const difficulty = difficultyGroup.difficultyId; // 'easy', 'medium', 'hard'

        if (difficultyGroup.questions && Array.isArray(difficultyGroup.questions)) {
          for (const qData of difficultyGroup.questions) {
            const qNum = qData.questionNumber;

            const questionObj = {
              questionNumber: qNum,
              subject: normalizedSubject,
              subjectDisplayName,
              lesson: chapterInfo.chapterName,
              difficulty,
              type: qData.questionType === 'single-correct' ? 'MCQ' : 'Numerical',
              testFolder: `QB-${chapterInfo.chapterId}`,
              subjectFolder: '',
              hasAnswerKey: true,
              source: 'question-bank',
              // Image path matching encoding pattern, without explicit encodeURI for Dev Server compat
              imagePath: `/QUESTION_BANK/${chapterInfo.folder}/${difficulty}/${qNum}`,
              questionType: qData.questionType || 'single-correct',
              correctAnswer: qData.correctAnswer || [],
              correctIntegerAnswer: qData.correctIntegerAnswer || null,
              correctAnswerKeys: qData.correctAnswer || [],
              options: qData.options || [
                { optionId: 'A', optionText: 'A' },
                { optionId: 'B', optionText: 'B' },
                { optionId: 'C', optionText: 'C' },
                { optionId: 'D', optionText: 'D' }
              ],
              marks: qData.marks || 4,
              negativeMarks: qData.negativeMarks || -1
            };

            questions.push(questionObj);
          }
        }
      }
    }

    questionBankCache[chapterInfo.chapterId] = questions;
    console.log(`[QB Debug] ✅ Loaded ${questions.length} questions for "${chapterInfo.chapterName}"`);
  } catch (error) {
    console.warn(`[QB Debug] Exception for ${chapterInfo.chapterName}:`, error);
  }

  return questions;
};

/**
 * Build the complete question pool from all registered tests.
 * Returns { questions: [...], lessonsBySubject: {...}, allLessons: [...] }
 */
export const buildQuestionPool = async () => {
  const questions = [];
  const lessonsBySubject = {
    physics: new Set(),
    chemistry: new Set(),
    mathematics: new Set()
  };

  // --- Phase 1: Load questions from previous year test papers ---
  for (const testInfo of TEST_REGISTRY) {
    try {
      const metadata = await loadTestMetadataJSON(testInfo.folder);
      if (!metadata || !metadata.sections) continue;

      // Load answer key if available
      let answerKey = null;
      if (testInfo.hasAnswerKey) {
        answerKey = await loadAnswerKeyForTest(testInfo.folder);
      }

      // Process each subject section
      for (const [subjectKey, questionsMap] of Object.entries(metadata.sections)) {
        const normalizedSubject = subjectKey.toLowerCase() === 'maths' ? 'mathematics' : subjectKey.toLowerCase();

        if (!lessonsBySubject[normalizedSubject]) continue;

        // Get answer key data for this section if available
        let answerKeyQuestions = {};
        if (answerKey) {
          const answerSection = answerKey.sections?.find(
            s => s.sectionId.toLowerCase() === normalizedSubject ||
              s.sectionId.toLowerCase() === subjectKey.toLowerCase()
          );
          if (answerSection) {
            answerSection.questions.forEach(q => {
              answerKeyQuestions[q.questionNumber.toString()] = q;
            });
          }
        }

        for (const [qNum, qData] of Object.entries(questionsMap)) {
          const lesson = qData.lesson || 'Unknown';
          const difficulty = (qData.difficulty || 'medium').toLowerCase();
          const type = qData.type || 'MCQ';

          lessonsBySubject[normalizedSubject].add(lesson);

          // Get the correct subject folder name for image paths
          const subjectFolder = testInfo.subjectFolders[normalizedSubject] || normalizedSubject;

          // Build question object
          const questionObj = {
            questionNumber: parseInt(qNum),
            subject: normalizedSubject,
            subjectDisplayName: normalizedSubject.charAt(0).toUpperCase() + normalizedSubject.slice(1),
            lesson,
            difficulty,
            type,
            testFolder: testInfo.folder,
            subjectFolder,
            hasAnswerKey: testInfo.hasAnswerKey,
            // Image path: /tests/{folder}/{subjectFolder}/{qNum}
            imagePath: `/tests/${encodeURI(testInfo.folder)}/${encodeURI(subjectFolder)}/${qNum}`,
            // Answer data (only for tests with answer keys)
            questionType: type === 'MCQ' ? 'single-correct' : 'integer',
            correctAnswer: [],
            correctIntegerAnswer: null,
            correctAnswerKeys: [],
            options: [],
            marks: 4,
            negativeMarks: -1
          };

          // Merge answer key data if available
          const akQuestion = answerKeyQuestions[qNum];
          if (akQuestion) {
            questionObj.questionType = akQuestion.questionType || questionObj.questionType;
            questionObj.correctAnswer = akQuestion.correctAnswer || [];
            questionObj.correctIntegerAnswer = akQuestion.correctIntegerAnswer || null;
            questionObj.correctAnswerKeys = akQuestion.correctAnswerKeys || akQuestion.correctAnswer || [];
            questionObj.options = akQuestion.options || [];
            questionObj.marks = akQuestion.marks || 4;
            questionObj.negativeMarks = akQuestion.negativeMarks || -1;
          }

          questions.push(questionObj);
        }
      }
    } catch (error) {
      console.warn(`Failed to load test ${testInfo.folder}:`, error);
    }
  }

  // --- Phase 2: Load questions from QUESTION BANK (chapter-wise) ---
  console.log(`[QB Debug] Starting Phase 2: Loading ${QUESTION_BANK_REGISTRY.length} chapters from QUESTION BANK...`);
  let totalChaptersLoaded = 0;
  for (const chapterInfo of QUESTION_BANK_REGISTRY) {
    try {
      const chapterQuestions = await loadQuestionBankChapter(chapterInfo);
      console.log(`[QB Debug] Chapter "${chapterInfo.chapterName}": loaded ${chapterQuestions.length} questions`);
      if (chapterQuestions.length > 0) {
        totalChaptersLoaded++;
        for (const q of chapterQuestions) {
          lessonsBySubject[q.subject].add(q.lesson);
          questions.push(q);
        }
      }
    } catch (error) {
      console.warn(`Failed to load question bank chapter ${chapterInfo.chapterName}:`, error);
    }
  }

  console.log(`Question Bank: Loaded ${totalChaptersLoaded} chapters with questions from QUESTION BANK`);

  // Convert sets to sorted arrays
  const lessonsBySubjectArray = {};
  for (const [subject, lessons] of Object.entries(lessonsBySubject)) {
    lessonsBySubjectArray[subject] = [...lessons].sort();
  }

  const allLessons = [...new Set([
    ...lessonsBySubjectArray.physics,
    ...lessonsBySubjectArray.chemistry,
    ...lessonsBySubjectArray.mathematics
  ])].sort();

  return {
    questions,
    lessonsBySubject: lessonsBySubjectArray,
    allLessons,
    totalTests: TEST_REGISTRY.length,
    totalChapters: totalChaptersLoaded
  };
};

/**
 * Filter the question pool based on selected criteria
 */
export const filterQuestions = (pool, filters) => {
  const { subjects = [], lessons = [], difficulties = [], questionType = 'all' } = filters;

  return pool.filter(q => {
    // Subject filter
    if (subjects.length > 0 && !subjects.includes(q.subject)) return false;

    // Lesson filter
    if (lessons.length > 0 && !lessons.includes(q.lesson)) return false;

    // Difficulty filter
    if (difficulties.length > 0 && !difficulties.includes(q.difficulty)) return false;

    // Question type filter
    if (questionType === 'mcq' && q.type !== 'MCQ') return false;
    if (questionType === 'numerical' && q.type !== 'Numerical') return false;

    return true;
  });
};

/**
 * Get available counts for UI display
 */
export const getAvailableCounts = (pool, filters) => {
  const filtered = filterQuestions(pool, filters);

  const bySubject = {};
  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  const byLesson = {};

  filtered.forEach(q => {
    bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    byLesson[q.lesson] = (byLesson[q.lesson] || 0) + 1;
  });

  return {
    total: filtered.length,
    bySubject,
    byDifficulty,
    byLesson
  };
};

/**
 * Fisher-Yates shuffle
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate a custom test from the question pool based on student's filters.
 * Stores the config in sessionStorage and returns test data in TestInterface format.
 */
export const generateCustomTest = (filteredQuestions, questionCount, config) => {
  // Shuffle and pick requested number of questions
  const shuffled = shuffleArray(filteredQuestions);
  const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

  // Group by subject
  const bySubject = {};
  selected.forEach(q => {
    if (!bySubject[q.subject]) bySubject[q.subject] = [];
    bySubject[q.subject].push(q);
  });

  // Build sections in standard order
  const subjectOrder = ['physics', 'chemistry', 'mathematics'];
  const sections = [];

  for (const subject of subjectOrder) {
    const subjectQuestions = bySubject[subject] || [];
    if (subjectQuestions.length === 0) continue;

    // Sort: MCQ first, then Numerical
    const mcq = subjectQuestions.filter(q => q.type === 'MCQ');
    const numerical = subjectQuestions.filter(q => q.type !== 'MCQ');
    const ordered = [...mcq, ...numerical];

    const processedQuestions = ordered.map((q, index) => {
      const questionNumber = index + 1;

      const optionsWithKeys = q.options?.length > 0
        ? q.options.map((opt, idx) => ({
          ...opt,
          optionKey: opt.optionKey || `${subject}-q${questionNumber}-opt-${idx + 1}`
        }))
        : [
          { optionId: 'A', optionKey: `${subject}-q${questionNumber}-opt-1` },
          { optionId: 'B', optionKey: `${subject}-q${questionNumber}-opt-2` },
          { optionId: 'C', optionKey: `${subject}-q${questionNumber}-opt-3` },
          { optionId: 'D', optionKey: `${subject}-q${questionNumber}-opt-4` }
        ];

      const questionType =
        q.questionType || (q.type === 'MCQ' ? 'single-correct' : 'integer');

      // ✅ NORMALIZATION FIX STARTS HERE
      const rawCorrect =
        q.correctAnswerKeys?.length > 0
          ? q.correctAnswerKeys
          : (q.correctAnswer || []);

      let normalizedCorrectKeys = rawCorrect;

      if (questionType === 'single-correct' && optionsWithKeys.length > 0) {
        normalizedCorrectKeys = rawCorrect.map(ans => {
          const match = optionsWithKeys.find(o => o.optionId === ans);
          return match ? match.optionKey : ans;
        });
      }
      // ✅ NORMALIZATION FIX ENDS HERE

      return {
        questionId: `${subject}-q${questionNumber}`,
        questionNumber,
        questionType,
        questionImage: q.imagePath,
        questionText: '',
        subject: q.subjectDisplayName,
        subjectId: q.subject,
        difficulty: q.difficulty,
        lesson: q.lesson,
        options:
          questionType === 'integer' || q.type === 'Numerical'
            ? []
            : optionsWithKeys,

        correctAnswer: rawCorrect,
        correctAnswerKeys: normalizedCorrectKeys,
        correctIntegerAnswer: q.correctIntegerAnswer,

        marks: q.marks ?? 4,
        negativeMarks: q.negativeMarks ?? -1,

        originalTestFolder: q.testFolder,
        originalQuestionNumber: q.questionNumber,
        hasAnswerKey: q.hasAnswerKey
      };
    });

    const sectionName = subject === 'mathematics' ? 'Mathematics' :
      subject.charAt(0).toUpperCase() + subject.slice(1);

    sections.push({
      sectionId: subject,
      sectionName,
      questionCount: processedQuestions.length,
      questions: processedQuestions
    });
  }

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const hasScoringData = selected.some(q => q.hasAnswerKey);
  const allHaveScoring = selected.every(q => q.hasAnswerKey);

  // Calculate appropriate duration: 3 minutes per MCQ, 5 minutes per numerical, capped at 3 hours
  const durationMinutes = Math.min(
    selected.reduce((sum, q) => sum + (q.type === 'Numerical' ? 5 : 3), 0),
    180
  );

  // Build title from filters
  const difficultyLabel = config.difficulties?.length === 1
    ? config.difficulties[0].charAt(0).toUpperCase() + config.difficulties[0].slice(1)
    : 'Mixed';
  const subjectLabel = config.subjects?.length === 1
    ? (config.subjects[0] === 'mathematics' ? 'Mathematics' : config.subjects[0].charAt(0).toUpperCase() + config.subjects[0].slice(1))
    : config.subjects?.length === 3 ? 'All Subjects' : 'Multi-Subject';

  const testData = {
    paperId: `custom-${Date.now()}`,
    paperTitle: `Custom Practice: ${subjectLabel} - ${difficultyLabel}`,
    paperType: 'Custom Practice',
    duration: durationMinutes * 60,
    totalQuestions,
    isDifficultyBased: false,
    isCustomTest: true,
    hasScoringData,
    allHaveScoring,
    sections,
    customConfig: config
  };

  // Store in sessionStorage for TestInterface to load
  sessionStorage.setItem('custom_test_data', JSON.stringify(testData));

  return testData;
};

/**
 * Check if a test ID is a custom test
 */
export const isCustomTest = (testId) => {
  return testId && testId.startsWith('custom-');
};

/**
 * Load a custom test from sessionStorage
 */
export const loadCustomTest = () => {
  try {
    const data = sessionStorage.getItem('custom_test_data');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading custom test:', e);
  }
  return null;
};


