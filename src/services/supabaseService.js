import { supabase } from '../supabaseClient';

/**
 * Helper: get the current Supabase Auth user's metadata (name, email, phone)
 * This is useful as a fallback when the users table doesn't have a row yet.
 */
const getAuthUserMeta = async () => {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const meta = user.user_metadata || {};
    return {
      email: user.email,
      name: meta.display_name || meta.name || meta.full_name || '',
      phone: meta.phone_number || meta.phone || '',
    };
  } catch {
    return null;
  }
};

const PROFILE_CACHE_KEY = 'cachedUserProfile';

/**
 * Get cached user profile from localStorage
 * @returns {Object|null} Cached profile or null
 */
export const getCachedProfile = () => {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    // ignore parse errors
  }
  return null;
};

/**
 * Cache user profile in localStorage
 * @param {Object|null} profile
 */
export const setCachedProfile = (profile) => {
  if (profile) {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  }
};

/**
 * Clear cached user profile
 */
export const clearCachedProfile = () => {
  localStorage.removeItem(PROFILE_CACHE_KEY);
};

/**
 * Get user profile from Supabase by email
 * @param {string} email - User's email
 * @param {boolean} skipCache - If true, always fetch from Supabase
 * @returns {Promise<Object|null>} User profile or null
 */
export const getUserProfile = async (email, skipCache = false) => {
  if (!email) return null;

  // Return cached profile if available (avoids rate limits)
  if (!skipCache) {
    const cached = getCachedProfile();
    if (cached && cached.email === email.toLowerCase()) {
      return cached;
    }
  }

  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error) {
      // No row in users table — fallback to Supabase Auth metadata
      console.warn('No profile row in users table, falling back to auth metadata');
      const authMeta = await getAuthUserMeta();
      if (authMeta && authMeta.email?.toLowerCase() === email.toLowerCase()) {
        // Auto-create user row from auth metadata
        const created = await saveUserProfile(authMeta);
        if (created) return created;
        // If auto-create failed, still return the metadata so the UI shows the name
        setCachedProfile(authMeta);
        return authMeta;
      }
      return null;
    }
    if (data) setCachedProfile(data);
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Save or update user profile in Supabase
 * @param {Object} profileData - Profile data { name, email, phone }
 * @returns {Promise<Object|null>} Saved profile or null
 */
export const saveUserProfile = async (profileData) => {
  if (!supabase) return null;
  
  try {
    const row = {
      name: profileData.name,
      email: profileData.email.toLowerCase(),
      phone: profileData.phone || '',
      password_hash: 'managed_by_supabase_auth',
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(row, { onConflict: 'email' })
      .select()
      .single();
    
    if (error) throw error;
    if (data) setCachedProfile(data);
    return data;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return null;
  }
};

/**
 * Save test result to Supabase
 * @param {Object} testResult - Test result data
 * @param {string} userEmail - User's email
 * @returns {Promise<Object|null>} Saved result or null
 */
export const saveTestResult = async (testResult, userEmail) => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return null;
  }
  
  if (!userEmail) {
    console.error('❌ No user email provided');
    return null;
  }
  
  try {
    console.log('📝 Preparing to save test result:', {
      userEmail,
      testId: testResult.testId,
      testTitle: testResult.testTitle
    });

    const { data, error } = await supabase
      .from('test_results')
      .insert({
        user_email: userEmail.toLowerCase(),
        test_id: testResult.testId,
        test_title: testResult.testTitle,
        total_marks: testResult.totalMarks,
        total_questions: testResult.totalQuestions,
        correct_answers: testResult.correctAnswers,
        incorrect_answers: testResult.incorrectAnswers,
        unattempted: testResult.unattempted,
        percentage: parseFloat(testResult.percentage),
        total_test_duration: testResult.totalTestDuration,
        section_wise_results: testResult.sectionWiseResults,
        fullscreen_exit_count: testResult.fullscreenExitCount || 0,
        question_details: testResult.questionDetails || [],
        completed_at: testResult.completedAt || new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    console.log('✅ Test result saved to Supabase:', data);
    return data;
  } catch (error) {
    console.error('❌ Error saving test result to Supabase:', error);
    return null;
  }
};

/**
 * Get all test results for a user from Supabase
 * @param {string} userEmail - User's email
 * @returns {Promise<Array>} Array of test results
 */
export const getTestResults = async (userEmail) => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return [];
  }
  
  if (!userEmail) {
    console.error('❌ No user email provided');
    return [];
  }
  
  try {
    console.log('📊 Fetching test results for:', userEmail);

    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_email', userEmail.toLowerCase())
      .order('completed_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }
    
    console.log(`📊 Found ${data?.length || 0} test results`);
    
    // Transform to match existing format
    return data.map(result => ({
      id: result.id,
      testId: result.test_id,
      testTitle: result.test_title,
      totalMarks: result.total_marks,
      totalQuestions: result.total_questions,
      correctAnswers: result.correct_answers,
      incorrectAnswers: result.incorrect_answers,
      unattempted: result.unattempted,
      percentage: result.percentage,
      totalTestDuration: result.total_test_duration,
      sectionWiseResults: result.section_wise_results,
      fullscreenExitCount: result.fullscreen_exit_count,
      questionDetails: result.question_details,
      completedAt: result.completed_at
    }));
  } catch (error) {
    console.error('❌ Error fetching test results from Supabase:', error);
    return [];
  }
};

/**
 * Delete a test result from Supabase
 * @param {number} resultId - Result ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteTestResult = async (resultId) => {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase
      .from('test_results')
      .delete()
      .eq('id', resultId);
    
    if (error) throw error;
    console.log('✅ Test result deleted from Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error deleting test result:', error);
    return false;
  }
};

/**
 * Submit a question report to Supabase
 * @param {Object} reportData - Report data
 * @returns {Promise<Object|null>} Saved report or null
 */
export const reportQuestion = async (reportData) => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('question_reports')
      .insert({
        test_id: reportData.testId,
        test_title: reportData.testTitle || null,
        question_id: reportData.questionId,
        question_number: reportData.questionNumber || null,
        subject: reportData.subject || null,
        reason: reportData.reason,
        description: reportData.description || null,
        user_email: reportData.userEmail ? reportData.userEmail.toLowerCase() : null,
        reported_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error reporting question:', error);
      throw error;
    }

    console.log('✅ Question report submitted:', data);
    return data;
  } catch (error) {
    console.error('❌ Error submitting question report:', error);
    return null;
  }
};

/**
 * Track a resource view or download in Supabase
 * @param {Object} resource - The resource data
 * @param {string} actionType - 'view' or 'download'
 * @param {string} [userEmail] - Optional user email
 * @returns {Promise<boolean>} Success status
 */
export const trackResourceEventSupabase = async (resource, actionType, userEmail = null) => {
  if (!supabase) {
    console.warn('⚠️ Supabase client not initialized, skipping resource tracking');
    return false;
  }

  try {
    const payload = {
      resource_id: String(resource.id),
      resource_title: resource.title || 'Unknown',
      action_type: actionType,
      subject: resource.subject || null,
      type: resource.type || null
    };

    if (userEmail) {
      payload.user_email = userEmail.toLowerCase();
    }

    console.log(`⏳ Attempting to insert ${actionType} event for ${resource.title} into Supabase...`, payload);
    const { data, error, status } = await supabase
      .from('resource_events')
      .insert(payload)
      .select();

    if (error) {
      console.error('❌ Supabase insertion error:', error);
      throw error;
    }
    
    console.log(`✅ Tracked ${actionType} for resource: ${resource.title} in Supabase. Response:`, data, status);
    return true;
  } catch (error) {
    console.error('❌ Error tracking resource event in Supabase:', error);
    return false;
  }
};

/**
 * Fetch analytics for a specific resource from Supabase
 * @param {string} resourceId - The resource ID
 * @returns {Promise<Object>} Views and downloads count
 */
/**
 * Fetch analytics for ALL resources from Supabase (for sorting by popularity)
 * @returns {Promise<Object>} Map of resourceId -> { views, downloads }
 */
export const getAllResourceAnalyticsSupabase = async () => {
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('resource_analytics')
      .select('resource_id, views, downloads');

    if (error) throw error;

    const analyticsMap = {};
    (data || []).forEach(row => {
      analyticsMap[String(row.resource_id)] = {
        views: row.views || 0,
        downloads: row.downloads || 0,
      };
    });
    return analyticsMap;
  } catch (error) {
    console.error('❌ Error fetching all resource analytics from Supabase:', error);
    return {};
  }
};

export const getResourceAnalyticsSupabase = async (resourceId) => {
  if (!supabase) return { views: 0, downloads: 0 };

  try {
    const { data, error } = await supabase
      .from('resource_analytics')
      .select('views, downloads')
      .eq('resource_id', String(resourceId))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - meaning 0 views/downloads
        return { views: 0, downloads: 0 };
      }
      throw error;
    }

    return {
      views: data.views || 0,
      downloads: data.downloads || 0
    };
  } catch (error) {
    console.error('❌ Error fetching resource analytics from Supabase:', error);
    return { views: 0, downloads: 0 };
  }
};

/**
 * Submit a seminar booking directly to Supabase
 * @param {Object} bookingData - { name, email, phone }
 * @returns {Promise<boolean>} Success status
 */
export const submitSeminarBooking = async (bookingData) => {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase
      .from('seminar_bookings')
      .insert({
        name: bookingData.name.trim(),
        email: bookingData.email.trim().toLowerCase(),
        phone: bookingData.phone ? bookingData.phone.trim() : null
      });

    if (error) {
      console.error('❌ Supabase booking error:', error);
      throw error;
    }
    
    console.log('✅ Seminar booking saved successfully to Supabase');
    return true;
  } catch (error) {
    // If it's a unique constraint error on email (if added), we can handle it
    console.error('❌ Error saving seminar booking:', error);
    throw error; // Throw so UI can catch and display alert
  }
};

/**
 * Check if the user has active access to Branch Comparison
 * @param {string} userEmail - User's email
 * @returns {Promise<boolean>} True if paid and not expired
 */
export const checkBranchComparisonAccess = async (userEmail) => {
  if (!supabase || !userEmail) return false;
  try {
    const { data, error } = await supabase
      .from('branch_compare_payments')
      .select('expires_at')
      .eq('email', userEmail.toLowerCase())
      .order('expires_at', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) return false;
    
    const expiresAt = new Date(data[0].expires_at);
    return expiresAt > new Date();
  } catch {
    return false;
  }
};

/**
 * Save Branch Comparison payment
 * @param {string} userEmail - User's email
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} orderId - Razorpay Order ID
 * @returns {Promise<boolean>} Success status
 */
export const saveBranchComparisonPayment = async (userEmail, paymentId, orderId) => {
  if (!supabase || !userEmail) return false;
  try {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6); // 6 months access
    
    const { error } = await supabase
      .from('branch_compare_payments')
      .insert({
        email: userEmail.toLowerCase(),
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        expires_at: expiresAt.toISOString()
      });
      
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving payment:', err);
    return false;
  }
};

/**
 * Track user inputs for Branch Comparison
 * @param {string} userEmail - User's email
 * @param {Object} inputs - The comparison inputs
 * @returns {Promise<boolean>}
 */
export const trackBranchComparisonInput = async (userEmail, inputs) => {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('branch_comparison_inputs')
      .insert({
        user_email: userEmail ? userEmail.toLowerCase() : null,
        college_1: inputs.college1 || null,
        branch_1: inputs.branch1 || null,
        college_2: inputs.college2 || null,
        branch_2: inputs.branch2 || null,
        user_query: inputs.userQuery || null,
        promo_code: inputs.promoCode || null
      });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error tracking branch comparison input:', err);
    return false;
  }
};

/**
 * Track user inputs for College Predictor
 * @param {string} userEmail - User's email
 * @param {Object} inputs - The predictor inputs
 * @returns {Promise<boolean>}
 */
export const trackCollegePredictorInput = async (userEmail, inputs) => {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('college_predictor_inputs')
      .insert({
        user_email: userEmail ? userEmail.toLowerCase() : null,
        exam: inputs.exam,
        rank: inputs.rank,
        category: inputs.category,
        gender_female: inputs.genderFemale,
        seat_pool: inputs.seatPool || null
      });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error tracking college predictor input:', err);
    return false;
  }
};
