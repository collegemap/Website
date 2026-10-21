/**
 * Test Discovery System
 * Dynamically discovers tests from public/tests folder
 */

import { isCustomTest } from './customTestGenerator';

// 2025 tests with metadata JSONs but no answerKey.json
const NEW_TEST_FOLDERS = [
  { folder: 'jee-main-2025-22-jan-shift-1', jsonFile: 'jee-main-2025-22-jan-shift-1.json' },
  { folder: 'jee-main-2025-22-jan-shift-2', jsonFile: 'jee-main-2025-22-jan-shift-2.json' },
  { folder: 'jee-main-2025-23rd-jan-shift-1', jsonFile: 'jee-main-2025-23rd-jan-shift-1.json' },
  { folder: 'jee-main-2025-24th-jan-shift-2', jsonFile: 'jee-main-2025-24th-jan-shift-2.json' },
  { folder: 'jee-main-2025-28th-jan-shift-1', jsonFile: 'jee-main-2025-28th-jan-shift-1.json' },
  { folder: 'jee-main-2025-28th-jan-shift-2', jsonFile: 'jee-main-2025-28th-jan-shift-2.json' },
  { folder: 'jee-main-2025-29th-jan-shift-1', jsonFile: 'jee-main-2025-29th-jan-shift-1.json' },
  { folder: 'jee-main-2025-29th-jan-shift-2', jsonFile: 'jee-main-2025-29th-jan-shift-2.json' }
];

/**
 * Discover all available tests from the tests folder
 * @returns {Promise<Array>} Array of test metadata
 */
export const discoverTests = async () => {
  try {
    // Try to fetch a tests manifest or list all test folders
    // Since we can't list directories in browser, we'll use a manifest approach
    // For now, we'll try to load known tests and check if they exist
    
    // Known test folders - can be extended (with answerKey.json)
    const knownTestFolders = [
      // 2026 tests
      'jee-main-2026-21-jan-shift-1',
      'jee-main-2026-21-jan-shift-2',
      'jee-main-2026-22-jan-shift-1',
      'jee-main-2026-22-jan-shift-2',
      'jee-main-2026-23-jan-shift-1',
      'jee-main-2026-23rd-jan-shift-2',
      'jee-main-2026-24th-jan-shift-1',
      'jee-main-2026-24th-jan-shift-2',
      'jee-main-2026-28th-jan-shift-1',
      'jee-main-2026-28th-jan-shift-2',
      // 2025 April tests
      'jee-main-2025-7th-apr-shift-1',
      'jee-main-2025-7th-apr-shift-2',
      'jee-main-2025-8th-apr-shift-2',
      // 2025 January tests
      'jee-main-2025-24th-jan-shift-1',
      'jee-main-2025-23rd-jan-shift-2',
      // 2024 Session 2 (April) tests
      'jee-main-2024-4th-apr-shift-1',
      'jee-main-2024-4th-apr-shift-2',
      'jee-main-2024-5th-apr-shift-1',
      'jee-main-2024-5th-apr-shift-2',
      'jee-main-2024-6th-apr-shift-1',
      'jee-main-2024-6th-apr-shift-2',
      'jee-main-2024-8th-apr-shift-1',
      'jee-main-2024-8th-apr-shift-2',
      'jee-main-2024-9th-apr-shift-1',
      'jee-main-2024-9th-apr-shift-2',
      // 2024 Session 1 (January / February) tests
      'jee-main-2024-27th-jan-shift-1',
      'jee-main-2024-27th-jan-shift-2',
      'jee-main-2024-29th-jan-shift-1',
      'jee-main-2024-29th-jan-shift-2',
      'jee-main-2024-30th-jan-shift-1',
      'jee-main-2024-30th-jan-shift-2',
      'jee-main-2024-31st-jan-shift-1',
      'jee-main-2024-1st-feb-shift-1',
      'jee-main-2024-1st-feb-shift-2',
      // 2023, 2022
      'jee-main-2023-25th-jan-shift-2',
      'jee-main-2022-27th-jan-shift-1'
    ];
    
    const tests = [];
    
    // Add regular full-length tests
    for (const testFolder of knownTestFolders) {
      try {
        const answerKey = await loadTestMetadata(testFolder);
        if (answerKey) {
          tests.push({
            id: testFolder,
            title: answerKey.paperTitle || formatTestName(testFolder),
            type: answerKey.paperType || 'JEE Main',
            duration: formatDuration(answerKey.duration),
            totalQuestions: answerKey.totalQuestions || 0,
            subjects: answerKey.sections?.map(s => s.sectionName) || ['Physics', 'Chemistry', 'Mathematics'],
            description: `Full-length test from ${testFolder}`,
            testFolder: testFolder,
            isDifficultyBased: false
          });
        }
      } catch (error) {
        console.warn(`Failed to load test ${testFolder}:`, error);
        // Continue to next test
      }
    }

    // Add 2025 tests (metadata-based, no answer keys but with question images)
    for (const testInfo of NEW_TEST_FOLDERS) {
      try {
        const url = `/tests/${encodeURIComponent(testInfo.folder)}/${encodeURIComponent(testInfo.jsonFile)}`;
        const response = await fetch(url);
        if (response.ok) {
          const metadata = await response.json();
          const totalQ = Object.values(metadata.sections || {}).reduce(
            (sum, section) => sum + Object.keys(section).length, 0
          );
          tests.push({
            id: testInfo.folder,
            title: metadata.paperTitle || formatTestName(testInfo.folder),
            type: 'JEE Main 2025',
            duration: '3 hours',
            totalQuestions: totalQ || 75,
            subjects: ['Physics', 'Chemistry', 'Mathematics'],
            description: `Practice paper from JEE Main 2025 (no auto-scoring)`,
            testFolder: testInfo.folder,
            isDifficultyBased: false,
            isPracticeOnly: true
          });
        }
      } catch (error) {
        console.warn(`Failed to load 2025 test ${testInfo.folder}:`, error);
      }
    }
    
    return tests;
  } catch (error) {
    console.error('Error discovering tests:', error);
    return [];
  }
};

/**
 * Load test metadata from answerKey.json
 * @param {string} testFolder - Name of the test folder
 * @returns {Promise<Object|null>} Test metadata or null if not found
 */
export const loadTestMetadata = async (testFolder) => {
  try {
    const response = await fetch(`/tests/${encodeURIComponent(testFolder)}/answerKey.json`);
    if (!response.ok) {
      return null;
    }
    // On deployed SPAs, missing static files return 200 + index.html instead of 404.
    // Guard against that by reading text first and checking for HTML.
    const text = await response.text();
    if (!text || text.trimStart().startsWith('<')) {
      return null; // file not on server yet
    }
    return JSON.parse(text);
  } catch (error) {
    // Silently skip — file simply isn't available on this environment
    return null;
  }
};

/**
 * Format test folder name to display name
 * @param {string} folderName - Folder name like "jee-main-2023-25th-jan-shift-2"
 * @returns {string} Formatted name
 */
const formatTestName = (folderName) => {
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\b(\d+)(st|nd|rd|th)\b/gi, '$1$2');
};

/**
 * Format duration from seconds to readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
const formatDuration = (seconds) => {
  if (!seconds) return '3 hours';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

/**
 * Get test by ID
 * @param {string} testId - Test ID (folder name or difficulty-based ID)
 * @returns {Promise<Object|null>} Test metadata or null
 */
export const getTestById = async (testId) => {
  // Check if it's a custom test
  if (isCustomTest(testId)) {
    // Custom tests are loaded from sessionStorage in TestInterface
    return {
      id: testId,
      title: 'Custom Practice Test',
      type: 'Custom Practice',
      duration: 'Variable',
      totalQuestions: 0,
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      description: 'Custom practice test built by student',
      isCustomTest: true
    };
  }

  // Regular test with answer key
  const metadata = await loadTestMetadata(testId);
  if (metadata) {
    return {
      id: testId,
      title: metadata.paperTitle || formatTestName(testId),
      type: metadata.paperType || 'JEE Main',
      duration: formatDuration(metadata.duration),
      totalQuestions: metadata.totalQuestions || 0,
      subjects: metadata.sections?.map(s => s.sectionName) || ['Physics', 'Chemistry', 'Mathematics'],
      description: `Full-length test from ${testId}`,
      testFolder: testId,
      isDifficultyBased: false
    };
  }

  // Could be a 2025 test without answer key - try loading its metadata JSON
  for (const testInfo of NEW_TEST_FOLDERS) {
    if (testInfo.folder === testId) {
      try {
        const url = `/tests/${encodeURIComponent(testInfo.folder)}/${encodeURIComponent(testInfo.jsonFile)}`;
        const response = await fetch(url);
        if (response.ok) {
          const meta = await response.json();
          return {
            id: testId,
            title: meta.paperTitle || formatTestName(testId),
            type: 'JEE Main 2025',
            duration: '3 hours',
            totalQuestions: 75,
            subjects: ['Physics', 'Chemistry', 'Mathematics'],
            description: 'Practice paper from JEE Main 2025',
            testFolder: testId,
            isPracticeOnly: true
          };
        }
      } catch (e) { /* not found */ }
    }
  }

  return null;
};
