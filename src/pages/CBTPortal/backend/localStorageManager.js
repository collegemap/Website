/**
 * Local Storage Manager for CBT Test Results
 * Organizes test results by user email for easy retrieval
 */

/**
 * Get the storage key for a user's test results
 * @param {string} email - User's email address
 * @returns {string} Storage key
 */
const getUserStorageKey = (email) => {
  if (!email) {
    return 'cbt_test_results_anonymous';
  }
  // Sanitize email for use as storage key
  const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
  return `cbt_test_results_${sanitizedEmail}`;
};

/**
 * Save test result locally for a specific user
 * @param {Object} testResult - Test result data
 * @param {Object} userProfile - User profile with email and name
 * @returns {boolean} Success status
 */
export const saveTestResultLocally = (testResult, userProfile) => {
  try {
    if (!userProfile || !userProfile.email) {
      console.warn('⚠️ No user email provided, saving to anonymous storage');
      const anonymousKey = getUserStorageKey(null);
      const anonymousResults = JSON.parse(localStorage.getItem(anonymousKey) || '[]');
      anonymousResults.push({
        ...testResult,
        userProfile: userProfile || {},
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(anonymousKey, JSON.stringify(anonymousResults));
      return true;
    }

    const storageKey = getUserStorageKey(userProfile.email);
    const existingResults = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Check for duplicates (same testId and completedAt)
    const isDuplicate = existingResults.some(r => 
      r.testId === testResult.testId && 
      r.completedAt === testResult.completedAt
    );

    if (isDuplicate) {
      console.log('⚠️ Duplicate test result, skipping save');
      return false;
    }

    // Add new result
    const newResult = {
      ...testResult,
      userProfile: {
        email: userProfile.email,
        name: userProfile.name || userProfile.fullName || 'Unknown',
        ...userProfile
      },
      savedAt: new Date().toISOString()
    };

    existingResults.push(newResult);
    localStorage.setItem(storageKey, JSON.stringify(existingResults));
    
    console.log(`✅ Saved test result locally for ${userProfile.email}`);
    console.log(`📊 Total results for user: ${existingResults.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error saving test result locally:', error);
    return false;
  }
};

/**
 * Get all test results for a specific user
 * @param {string} email - User's email address
 * @returns {Array} Array of test results
 */
export const getTestResultsByEmail = (email) => {
  try {
    const storageKey = getUserStorageKey(email);
    const results = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Sort by completedAt (most recent first)
    return results.sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('❌ Error fetching test results:', error);
    return [];
  }
};

/**
 * Get all test results for all users (admin function)
 * @returns {Object} Object with email as key and results as value
 */
export const getAllTestResults = () => {
  try {
    const allResults = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('cbt_test_results_')) {
        const email = key.replace('cbt_test_results_', '');
        if (email !== 'anonymous') {
          allResults[email] = JSON.parse(localStorage.getItem(key) || '[]');
        }
      }
    });
    
    return allResults;
  } catch (error) {
    console.error('❌ Error fetching all test results:', error);
    return {};
  }
};

/**
 * Delete a specific test result
 * @param {string} email - User's email
 * @param {string} testId - Test ID
 * @param {string} completedAt - Completion timestamp
 * @returns {boolean} Success status
 */
export const deleteTestResult = (email, testId, completedAt) => {
  try {
    const storageKey = getUserStorageKey(email);
    const results = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const filteredResults = results.filter(r => 
      !(r.testId === testId && r.completedAt === completedAt)
    );
    
    localStorage.setItem(storageKey, JSON.stringify(filteredResults));
    console.log(`✅ Deleted test result for ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting test result:', error);
    return false;
  }
};

/**
 * Get storage statistics
 * @returns {Object} Statistics about stored results
 */
export const getStorageStats = () => {
  try {
    const keys = Object.keys(localStorage);
    const testResultKeys = keys.filter(k => k.startsWith('cbt_test_results_'));
    
    let totalResults = 0;
    let totalUsers = 0;
    
    testResultKeys.forEach(key => {
      const results = JSON.parse(localStorage.getItem(key) || '[]');
      totalResults += results.length;
      if (results.length > 0) {
        totalUsers++;
      }
    });
    
    return {
      totalUsers,
      totalResults,
      storageKeys: testResultKeys.length
    };
  } catch (error) {
    console.error('❌ Error getting storage stats:', error);
    return { totalUsers: 0, totalResults: 0, storageKeys: 0 };
  }
};
