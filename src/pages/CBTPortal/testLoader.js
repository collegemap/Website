/**
 * Image-based Test Loader
 * Loads test data from image folders and answer key JSON
 */

import { isCustomTest, loadCustomTest } from './customTestGenerator';

/**
 * Tests with capitalized subject folders (Physics, Chemistry, Maths).
 * Case-sensitive on Linux servers - folder names must match exactly.
 */
const TESTS_WITH_CAPITALIZED_FOLDERS = new Set([
  'jee-main-2026-21-jan-shift-1',
  'jee-main-2026-21-jan-shift-2',
  'jee-main-2025-22-jan-shift-1',
  'jee-main-2025-22-jan-shift-2',
  'jee-main-2025-23rd-jan-shift-1',
  'jee-main-2025-24th-jan-shift-2',
  'jee-main-2025-28th-jan-shift-1',
  'JEE Main 2025 (28 Jan Shift 2)',
  'JEE Main 2025 (29 Jan Shift 1)',
  'JEE Main 2025 (29 Jan Shift 2)'
]);

/**
 * Get image path for a question
 * @param {string} testName - Name of the test folder
 * @param {string} subject - Subject folder name (physics, chemistry, maths)
 * @param {number} questionNumber - Question number (1-indexed)
 * @returns {string} Image path
 */
export const getQuestionImagePath = (testName, subject, questionNumber) => {
  const usesCapitalizedFolders = testName && TESTS_WITH_CAPITALIZED_FOLDERS.has(testName);
  // 2022/2023 use "mathematics" folder; 2026 (non-21-jan) use "maths"
  const usesMathematicsFolder = testName && (testName.includes('2022') || testName.includes('2023'));

  let subjectFolderMap;
  if (usesCapitalizedFolders) {
    subjectFolderMap = { 'physics': 'Physics', 'chemistry': 'Chemistry', 'mathematics': 'Maths', 'maths': 'Maths' };
  } else if (usesMathematicsFolder) {
    subjectFolderMap = { 'physics': 'physics', 'chemistry': 'chemistry', 'mathematics': 'mathematics', 'maths': 'mathematics' };
  } else {
    subjectFolderMap = { 'physics': 'physics', 'chemistry': 'chemistry', 'mathematics': 'maths', 'maths': 'maths' };
  }

  const folderName = subjectFolderMap[subject.toLowerCase()] || subject.toLowerCase();

  const basePath = `/tests/${encodeURIComponent(testName)}/${encodeURIComponent(folderName)}/${questionNumber}`;
  return basePath;
};

/**
 * Load answer key JSON for a test
 * @param {string} testName - Name of the test folder
 * @returns {Promise<Object>} Answer key data
 */
export const loadAnswerKey = async (testName) => {
  try {
    const response = await fetch(`/tests/${testName}/answerKey.json`);
    if (!response.ok) {
      throw new Error(`Failed to load answer key: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading answer key:', error);
    throw error;
  }
};

/**
 * Check if an image exists - Improved for Chemistry and Mathematics
 * @param {string} imagePath - Path to the image (without extension)
 * @returns {Promise<string|null>} Full path to image if exists, null otherwise
 */
export const checkImageExists = async (imagePath) => {
  // Try .png first since all images are .png files
  const basePath = imagePath.replace(/\.(png|jpe?g)$/i, '');
  const extensions = ['.png', '.PNG', '.jpg', '.JPG', '.jpeg', '.JPEG'];
  
  for (const ext of extensions) {
    try {
      const fullPath = `${basePath}${ext}`;
      const response = await fetch(fullPath, { method: 'GET' });
      if (response.ok) {
        console.log(`✅ Found image: ${fullPath}`);
        return fullPath;
      }
    } catch (error) {
      // Continue to next extension
    }
  }
  
  console.warn(`⚠️ Image not found: ${imagePath} (tried: ${extensions.join(', ')})`);
  return null;
};

/**
 * Load test data from images and answer key
 * @param {string} testName - Name of the test folder or difficulty-based test ID
 * @returns {Promise<Object>} Complete test data with image paths
 */
export const loadImageBasedTest = async (testName) => {
  try {
    // Check if it's a custom test (built from Custom Test Builder)
    if (isCustomTest(testName)) {
      console.log(`📝 Loading custom test: ${testName}`);
      const customTestData = loadCustomTest();
      if (!customTestData) {
        throw new Error('Custom test data not found. Please rebuild the test.');
      }
      console.log(`✅ Loaded custom test with ${customTestData.totalQuestions} questions`);
      return customTestData;
    }

    // Load regular image-based test
    // First try loading answer key
    let answerKey = null;
    try {
      answerKey = await loadAnswerKey(testName);
    } catch (e) {
      // No answer key - might be a 2025 practice test
    }

    // If no answer key, try loading as a 2025 metadata-based test
    if (!answerKey) {
      const practiceTest = await loadPracticeTest(testName);
      if (practiceTest) return practiceTest;
      throw new Error(`No answer key or metadata found for test: ${testName}`);
    }
    
    // Process sections and add image paths
    const processedSections = answerKey.sections.map(section => {
      // Filter out empty question arrays and handle missing questions
      const validQuestions = (section.questions || []).filter(q => q && q.questionNumber);
      const processedQuestions = validQuestions.map(question => {
        const imagePath = getQuestionImagePath(
          testName,
          section.sectionId,
          question.questionNumber
        );
        
        // Generate unique option keys if not present
        const optionsWithKeys = question.options ? question.options.map((opt, idx) => ({
          ...opt,
          optionKey: opt.optionKey || `${section.sectionId}-${question.questionNumber}-opt-${idx + 1}`
        })) : [];
        
        // Convert correctAnswer to correctAnswerKeys if needed
        let correctAnswerKeys = question.correctAnswerKeys || question.correctAnswer || [];
        if (correctAnswerKeys.length > 0 && typeof correctAnswerKeys[0] === 'string' && 
            (correctAnswerKeys[0].length === 1 || ['A', 'B', 'C', 'D'].includes(correctAnswerKeys[0]))) {
          // Convert option IDs to option keys
          correctAnswerKeys = correctAnswerKeys.map(ans => {
            const option = optionsWithKeys.find(opt => opt.optionId === ans);
            return option ? option.optionKey : ans;
          });
        }
        
        return {
          ...question,
          questionId: question.questionId || `${section.sectionId}-${question.questionNumber}`,
          questionImage: imagePath, // Base path, will try different extensions
          questionText: '', // No text, only images
          subject: section.sectionName,
          options: optionsWithKeys,
          correctAnswer: question.correctAnswer || [],
          correctAnswerKeys: correctAnswerKeys
        };
      });
      
      return {
        ...section,
        questions: processedQuestions
      };
    });
    
    return {
      ...answerKey,
      sections: processedSections
    };
  } catch (error) {
    console.error('Error loading image-based test:', error);
    throw error;
  }
};

/**
 * Load a 2025 practice test from metadata JSON (no answer key)
 * These tests have question images and difficulty/lesson metadata but no correct answers
 */
const PRACTICE_TEST_JSON_MAP = {
  'jee-main-2025-22-jan-shift-1': 'jee-main-2025-22-jan-shift-1.json',
  'jee-main-2025-22-jan-shift-2': 'jee-main-2025-22-jan-shift-2.json',
  'jee-main-2025-23rd-jan-shift-1': 'jee-main-2025-23rd-jan-shift-1.json',
  'jee-main-2025-24th-jan-shift-2': 'jee-main-2025-24th-jan-shift-2.json',
  'jee-main-2025-28th-jan-shift-1': 'jee-main-2025-28th-jan-shift-1.json',
  'JEE Main 2025 (28 Jan Shift 2)': 'jee-main-2025-28th-jan-shift-2.json',
  'JEE Main 2025 (29 Jan Shift 1)': 'jee-main-2025-29th-jan-shift-1.json',
  'JEE Main 2025 (29 Jan Shift 2)': 'jee-main-2025-29th-jan-shift-2.json'
};

// Subject folder mapping for 2025 tests (capitalized names, Maths instead of mathematics)
const PRACTICE_SUBJECT_FOLDERS = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  mathematics: 'Maths',
  maths: 'Maths'
};

const loadPracticeTest = async (testName) => {
  const jsonFile = PRACTICE_TEST_JSON_MAP[testName];
  if (!jsonFile) return null;

  try {
    const response = await fetch(`/tests/${encodeURI(testName)}/${jsonFile}`);
    if (!response.ok) return null;
    const metadata = await response.json();

    const subjectOrder = ['physics', 'chemistry', 'mathematics'];
    const sections = [];

    for (const subjectKey of subjectOrder) {
      const questionsMap = metadata.sections[subjectKey] || metadata.sections[subjectKey === 'mathematics' ? 'maths' : subjectKey];
      if (!questionsMap) continue;

      const subjectFolder = PRACTICE_SUBJECT_FOLDERS[subjectKey] || subjectKey;
      const questions = Object.entries(questionsMap).map(([qNum, qData]) => {
        const questionNumber = parseInt(qNum);
        const isMCQ = qData.type === 'MCQ';
        const imagePath = `/tests/${encodeURI(testName)}/${encodeURI(subjectFolder)}/${qNum}`;

        const options = isMCQ ? [
          { optionId: 'A', optionKey: `${subjectKey}-${questionNumber}-opt-1` },
          { optionId: 'B', optionKey: `${subjectKey}-${questionNumber}-opt-2` },
          { optionId: 'C', optionKey: `${subjectKey}-${questionNumber}-opt-3` },
          { optionId: 'D', optionKey: `${subjectKey}-${questionNumber}-opt-4` }
        ] : [];

        return {
          questionId: `${subjectKey}-${questionNumber}`,
          questionNumber,
          questionType: isMCQ ? 'single-correct' : 'integer',
          questionImage: imagePath,
          questionText: '',
          subject: subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1),
          difficulty: qData.difficulty,
          lesson: qData.lesson,
          options,
          correctAnswer: [],
          correctAnswerKeys: [],
          correctIntegerAnswer: null,
          marks: 4,
          negativeMarks: -1,
          hasAnswerKey: false
        };
      });

      // Sort by question number
      questions.sort((a, b) => a.questionNumber - b.questionNumber);

      const sectionName = subjectKey === 'mathematics' ? 'Mathematics' :
                          subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1);

      sections.push({
        sectionId: subjectKey,
        sectionName,
        questionCount: questions.length,
        questions
      });
    }

    return {
      paperId: metadata.paperId || testName,
      paperTitle: metadata.paperTitle || testName,
      paperType: 'JEE Main 2025',
      duration: 10800,
      totalQuestions: sections.reduce((sum, s) => sum + s.questions.length, 0),
      sections,
      isPracticeOnly: true,
      hasScoringData: false
    };
  } catch (e) {
    console.warn(`Failed to load practice test ${testName}:`, e);
    return null;
  }
};

/**
 * Resolve actual image URL (tries different extensions)
 * @param {string} basePath - Base path without extension
 * @returns {Promise<string|null>} Resolved image URL or null
 */
export const resolveImageUrl = async (basePath) => {
  return await checkImageExists(basePath);
};
