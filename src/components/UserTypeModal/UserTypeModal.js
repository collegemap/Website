import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserTypeModal.css';

const UserTypeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (!userType && location.pathname === '/') {
      setIsOpen(true);
    }
  }, [location.pathname]);

  const handleSelection = (type) => {
    localStorage.setItem('userType', type);
    setIsOpen(false);
    // Dispatch an event so other components (like navbar) can update if needed
    window.dispatchEvent(new Event('userTypeChanged'));
    
    if (type === 'college') {
      navigate('/home');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="user-type-modal-overlay">
      <div className="user-type-modal-content">
        <h2>Welcome to CollegeMap!</h2>
        <p>To help us personalize your experience, please let us know what you are looking for:</p>
        <div className="user-type-modal-buttons">
          <button 
            className="user-type-btn jee-btn"
            onClick={() => handleSelection('jee')}
          >
            I'm a JEE Aspirant
          </button>
          <button 
            className="user-type-btn college-btn"
            onClick={() => handleSelection('college')}
          >
            I am looking for Colleges
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTypeModal;
