import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { saveUserProfile } from '../../services/supabaseService';
import { useUserProfile } from '../../context/UserProfileContext';
import './ProfileSetup.scss';

const ProfileSetup = () => {
  const { setProfile } = useUserProfile();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const testId = location.state?.testId;
  const redirectTo = location.state?.redirectTo;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    const profileData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase()
    };

    try {
      const savedProfile = await saveUserProfile(profileData);
      
      if (!savedProfile) {
        setError('Failed to save profile. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ Profile saved to Supabase:', savedProfile);
      
      // Store email in sessionStorage as identifier
      sessionStorage.setItem('userEmail', savedProfile.email);
      
      // Update UserProfileContext with the saved profile data
      setProfile({
        name: savedProfile.name,
        email: savedProfile.email
      });
      
      // Navigate to test or dashboard
      if (testId) {
        navigate(`/exams/test/${testId}`);
      } else if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate('/exams');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup">
      <motion.div
        className="profile-setup-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profile-header">
          <h1>Setup Your Profile</h1>
          <p>Please complete your profile to access the CBT Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue to Test'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
