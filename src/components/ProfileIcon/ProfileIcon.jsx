import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfile } from '../../context/UserProfileContext';
import { saveUserProfile } from '../../services/supabaseService';
import './ProfileIcon.scss';

const ProfileIcon = () => {
  const { userProfile, setProfile } = useUserProfile();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProfile = () => {
    setFormData({
      name: userProfile?.name || '',
      email: userProfile?.email || '',
      phone: userProfile?.phone || ''
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      setError('Valid email is required');
      return;
    }

    setLoading(true);
    try {
      const savedProfile = await saveUserProfile({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim()
      });

      if (savedProfile) {
        setProfile(savedProfile);
        sessionStorage.setItem('userEmail', savedProfile.email);
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          setShowModal(false);
        }, 1200);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = userProfile?.name 
    ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '👤';

  return (
    <>
      <div className="profile-icon-container" onClick={loadProfile}>
        <div className="profile-avatar">
          {initials}
        </div>
        <div className="profile-name">{userProfile?.name || 'User'}</div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="profile-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="profile-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <h2>Update Profile</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label htmlFor="profile-name">Full Name *</label>
                  <input
                    type="text"
                    id="profile-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profile-email">Email Address *</label>
                  <input
                    type="email"
                    id="profile-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profile-phone">Phone Number</label>
                  <input
                    type="tel"
                    id="profile-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <button type="submit" className="update-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProfileIcon;
