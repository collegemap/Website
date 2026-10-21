import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, getCachedProfile, clearCachedProfile } from '../services/supabaseService';

const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount — prefer localStorage cache to avoid Supabase rate limits
  useEffect(() => {
    const loadProfile = () => {
      // Try cache first (no network call)
      const cached = getCachedProfile();
      if (cached) {
        setUserProfile(cached);
        setLoading(false);
        return;
      }

      // Fallback: check sessionStorage for email and fetch once
      const emailStored = sessionStorage.getItem('userEmail');
      if (emailStored) {
        getUserProfile(emailStored)
          .then((profile) => {
            if (profile) setUserProfile(profile);
          })
          .catch((error) => {
            console.error('Error loading user profile:', error);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Refresh profile from Supabase (skips cache)
  const refreshProfile = async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(email, true); // skipCache = true
      if (profile) setUserProfile(profile);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const setProfile = (profile) => {
    setUserProfile(profile);
  };

  const clearProfile = () => {
    setUserProfile(null);
    clearCachedProfile();
  };

  return (
    <UserProfileContext.Provider value={{ userProfile, loading, refreshProfile, setProfile, clearProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within UserProfileProvider');
  }
  return context;
};
