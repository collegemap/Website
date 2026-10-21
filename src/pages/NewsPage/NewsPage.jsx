import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './NewsPage.scss';
import { collegemapApiUrl } from '../../collegemapApiOrigin';

const NewsPage = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const response = await fetch(collegemapApiUrl('/api/nta-updates'));
      const data = await response.json();
      
      if (data.success) {
        setUpdates(data.updates);
        setError(null);
      } else {
        setError('Failed to fetch updates');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
    
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchUpdates, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleViewUpdate = (update) => {
    setSelectedUpdate(update);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUpdate(null);
  };

  const toggleCardExpand = (updateId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(updateId)) {
        newSet.delete(updateId);
      } else {
        newSet.add(updateId);
      }
      return newSet;
    });
  };

  const shouldShowReadMore = (title) => {
    return title && title.length > 150;
  };

  return (
    <div className="nta-news-page">
      <motion.div 
        className="news-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>NTA Latest Updates</h1>
        <p className="subtitle">Stay updated with National Testing Agency notifications</p>
      </motion.div>

      <motion.div 
        className="news-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {loading && updates.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading latest updates...</p>
          </div>
        ) : error && updates.length === 0 ? (
          <div className="error-state">
            <h3>⚠️ {error}</h3>
            <button onClick={fetchUpdates} className="retry-btn">Try Again</button>
          </div>
        ) : updates.length === 0 ? (
          <div className="no-results">
            <h3>No updates found</h3>
            <p>Check back later for new updates</p>
          </div>
        ) : (
          <div className="news-grid">
            {updates.map((update, index) => (
              <motion.div 
                className="news-card"
                key={update.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, boxShadow: '0 10px 20px rgba(0,0,0,0.25)' }}
              >
                <div className="news-content">
                  <h3 className={expandedCards.has(update.id) ? 'expanded' : ''}>
                    {update.title}
                  </h3>
                  {shouldShowReadMore(update.title) && (
                    <button 
                      className="read-more-btn"
                      onClick={() => toggleCardExpand(update.id)}
                    >
                      {expandedCards.has(update.id) ? 'Show Less ↑' : 'Read More ↓'}
                    </button>
                  )}
                  <div className="news-actions">
                    <a 
                      href={update.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="external-link"
                    >
                      More Details→
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal for detailed view */}
      <AnimatePresence>
        {showModal && selectedUpdate && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{selectedUpdate.title}</h2>
                <button className="close-button" onClick={handleCloseModal}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="update-description">
                  {selectedUpdate.description || 'No additional details available.'}
                </div>
              </div>
              <div className="modal-footer">
                <a 
                  href={selectedUpdate.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="open-nta-button"
                >
                  Visit Official NTA Page
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsPage;