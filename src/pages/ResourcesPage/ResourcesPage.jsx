import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './ResourcesPage.scss';
import { resourcesData } from './ResourcesData';
import { collegemapApiUrl } from '../../collegemapApiOrigin';
import { trackResourceEventSupabase, getResourceAnalyticsSupabase, getAllResourceAnalyticsSupabase, getCachedProfile } from '../../services/supabaseService';

const ResourcesPage = () => {
  const location = useLocation();
  const { resourceType } = useParams();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [activeSubject, setActiveSubject] = useState('All');
  const [activeType, setActiveType] = useState('JEE Busters');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReferenceBookSource, setSelectedReferenceBookSource] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceAnalytics, setResourceAnalytics] = useState(null);
  const [allAnalytics, setAllAnalytics] = useState({});

  // Fetch resources and all analytics on mount
  useEffect(() => {
    setResources(resourcesData);
    setFilteredResources(resourcesData);

    // Fetch all resource analytics for sorting by popularity
    getAllResourceAnalyticsSupabase().then(analyticsMap => {
      setAllAnalytics(analyticsMap);
    });
  }, []);

  // Handle URL route parameters for filtering
  useEffect(() => {
    if (resourceType) {
      const typeMap = {
        'jeebusters': 'JEE Busters',
        'shortnotes': 'Cheatsheets',
        'cheatsheets': 'Cheatsheets',
        'practice': 'Practice',
        'referencebooks': 'Reference Books'
      };

      const mappedType = typeMap[resourceType.toLowerCase()];
      if (mappedType) {
        setActiveType(mappedType);
      }
    } else {
      // Fallback to legacy query parameter logic
      const searchParams = new URLSearchParams(location.search);
      const filterParam = searchParams.get('filter');

      if (filterParam) {
        const filterMap = {
          'jee-busters': 'JEE Busters',
          'short-notes': 'Cheatsheets',
          'practice': 'Practice'
        };

        const mappedType = filterMap[filterParam];
        if (mappedType) {
          setActiveType(mappedType);
          setActiveSubject('All');
        }
      }
    }
  }, [resourceType, location.search]);

  // Track resource event (silently in background)
  const trackResourceEvent = async (resource, actionType) => {
    try {
      const userProfile = getCachedProfile();
      await trackResourceEventSupabase(resource, actionType, userProfile?.email);
    } catch (error) {
      console.error('❌ Failed to track event:', error.message);
      // Silently fail - don't block user experience
    }
  };

  // Filter resources based on selected filters
  useEffect(() => {
    let result = resources;

    // Filter by subject
    if (activeSubject !== 'All') {
      result = result.filter(resource =>
        resource.subject === activeSubject || resource.subject === 'All'
      );
    }

    // Filter by type
    if (activeType !== 'All') {
      result = result.filter(resource => resource.type === activeType);
    }

    // For Reference Books type, only show if a Reference Book source is selected
    if (activeType === 'Reference Books') {
      if (!selectedReferenceBookSource) {
        result = [];
      } else {
        result = result.filter(resource => resource.ReferenceBookSource === selectedReferenceBookSource);
      }
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        resource =>
          resource.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by popularity (views + downloads) descending, fallback to A-Z
    result = [...result].sort((a, b) => {
      const aStats = allAnalytics[String(a.id)] || { views: 0, downloads: 0 };
      const bStats = allAnalytics[String(b.id)] || { views: 0, downloads: 0 };
      const aCount = aStats.views + aStats.downloads;
      const bCount = bStats.views + bStats.downloads;
      if (bCount !== aCount) return bCount - aCount;
      return a.title.localeCompare(b.title);
    });

    setFilteredResources(result);
  }, [resources, activeSubject, activeType, searchQuery, selectedReferenceBookSource, allAnalytics]);

  // Get unique subjects and types for filters
  const subjects = ['All', ...new Set(resources.map(item => item.subject).filter(s => s !== 'All'))];
  const types = ['JEE Busters', 'Cheatsheets', 'Practice', 'Reference Books'];
  const ReferenceBookSources = [...new Set(
    resources
      .filter(item => item.type === 'Reference Books' && (activeSubject === 'All' || item.subject === activeSubject))
      .map(item => item.ReferenceBookSource)
      .filter(Boolean)
  )];
  const showReferenceBooks = activeType === 'Reference Books' && !selectedReferenceBookSource && ReferenceBookSources.length > 0;

  const handleTypeChange = (type) => {
    setActiveType(type);
    if (type !== 'Reference Books') {
      setSelectedReferenceBookSource(null);
    }

    // Update URL when type changes
    const urlMap = {
      'JEE Busters': 'JEEBusters',
      'Cheatsheets': 'ShortNotes',
      'Practice': 'Practice',
      'Reference Books': 'ReferenceBooks'
    };

    const mappedUrl = urlMap[type] || 'JEEBusters';
    navigate(`/Resources/${mappedUrl}`, { replace: true });
  };

  const handleReferenceBooksClick = (source) => {
    setSelectedReferenceBookSource(source);
  };

  const handleBackFromReferenceBooks = () => {
    setSelectedReferenceBookSource(null);
  };

  // Fetch analytics for a specific resource
  const fetchResourceAnalytics = async (resourceId) => {
    try {
      // Fetch from Supabase
      const supabaseAnalytics = await getResourceAnalyticsSupabase(resourceId);
      return supabaseAnalytics;
    } catch (error) {
      console.error('❌ Failed to fetch analytics:', error.message);
      return { views: 0, downloads: 0 };
    }
  };

  const handleViewResource = async (resource) => {
    setSelectedResource(resource);
    setShowModal(true);

    // Fire tracking in background, then update stats so UI isn't blocked
    trackResourceEvent(resource, 'view').then(() => {
      fetchResourceAnalytics(resource.id).then(analytics => {
        setResourceAnalytics(analytics);
      });
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResource(null);
    setResourceAnalytics(null);
  };

  // Helper function to create a direct download link for files
  const getDownloadLink = (url) => {
    const fileIdMatch = url.match(/\/d\/(.*?)\//);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url; // Fallback for folders (though this button won't show)
  };

  return (
    <div className="resources-page">
      <Helmet>
        <title>JEE Study Resources | Notes, PYQs & Practice Papers by IITians — CollegeMap</title>
        <meta name="description" content="Access free JEE study resources curated by IITians" />
        <link rel="canonical" href="https://collegemap.in/Resources" />
      </Helmet>
      <motion.div
        className="resources-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="resources-header-inner">
          <div className="resources-header-text">
            <h1>Top Resources</h1>
            <p className="resources-header-sub">
              Best Resources, curated by IITians
            </p>
          </div>
          <div className="resources-header-search">
            <div className="search-bar">
              <input
                type="search"
                placeholder="Search for resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search resources"
              />
              <button type="button" className="search-button" aria-label="Search">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <elevenlabs-convai agent-id="agent_6001k906ndgzee69c8hjc31kv5fg"></elevenlabs-convai>

      <div className="filter-section">
        <div className="filter-container">
          <div className="filter-group subject-filters">
            <h3>Subject</h3>
            <div className="filter-buttons">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  className={activeSubject === subject ? 'active' : ''}
                  onClick={() => setActiveSubject(subject)}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group type-filters">
            <h3>Resource Type</h3>
            <div className="filter-buttons">
              {types.map((type) => (
                <button
                  key={type}
                  className={activeType === type ? 'active' : ''}
                  onClick={() => handleTypeChange(type)}
                >
                  {type === 'Practice Papers' ? 'Practice Papers' :
                    type === 'Cheatsheets' ? 'Short Notes' :
                      type === 'JEE Busters' ? 'JEE Busters' : type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="resources-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {showReferenceBooks ? (
          <div className="resources-grid">
            {ReferenceBookSources.map((source) => (
              <motion.div
                className="resource-card"
                key={source}
                whileHover={{ scale: 1.03, boxShadow: '0 10px 20px rgba(0,0,0,0.25)' }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="resource-content">
                  <span className={`type-indicator Reference Books`}>Reference Books</span>
                  <div className="resource-details">
                    <h3>{source}</h3>
                    <p className="resource-subject">{activeSubject === 'All' ? 'All Subjects' : activeSubject}</p>
                    <div className="resource-actions">
                      <button
                        onClick={() => handleReferenceBooksClick(source)}
                        className="view-button"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            {selectedReferenceBookSource && activeType === 'Reference Books' && (
              <div className="back-button-container">
                <button className="back-button" onClick={handleBackFromReferenceBooks}>
                  ←Back
                </button>
              </div>
            )}
            {filteredResources.length === 0 ? (
              <div className="no-results">
                <h3>No resources found</h3>
                <p>Try changing your filters or search query</p>
              </div>
            ) : (
              <div className="resources-grid">
                {filteredResources.map((resource) => (
                  <motion.div
                    className="resource-card"
                    key={resource.id}
                    whileHover={{ scale: 1.03, boxShadow: '0 10px 20px rgba(0,0,0,0.25)' }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="resource-content">
                      <span className={`type-indicator ${resource.type}`}>
                        {resource.type === 'Practice Papers' ? 'Practice Papers' :
                          resource.type === 'Cheatsheets' ? 'Short Notes' :
                            resource.type === 'JEE Busters' ? 'JEE Busters' : resource.type}
                      </span>
                      <div className="resource-details">
                        <h3>{resource.title}</h3>
                        <p className="resource-subject">{resource.subject}</p>
                        {(() => {
                          const stats = allAnalytics[String(resource.id)];
                          if (stats && (stats.views > 0 || stats.downloads > 0)) {
                            return (
                              <div className="resource-card-stats">
                                {stats.views > 0 && <span className="card-views">👁️ {stats.views * 3}</span>}
                                {stats.downloads > 0 && <span className="card-downloads">📥 {stats.downloads * 3}</span>}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <div className="resource-actions">
                          <button
                            onClick={() => handleViewResource(resource)}
                            className="view-button"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && selectedResource && (
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
                <h2>{selectedResource.title}</h2>
                <button className="close-button" onClick={handleCloseModal}>
                  X
                </button>
              </div>
              <div className="modal-body">
                {resourceAnalytics && (resourceAnalytics.views > 0 || resourceAnalytics.downloads > 0) && (
                  <div className="resource-stats">
                    {resourceAnalytics.views > 0 && (
                      <span className="views-count">👁️ {resourceAnalytics.views * 5} views</span>
                    )}
                    {resourceAnalytics.downloads > 0 && (
                      <span className="downloads-count" style={{ marginLeft: '15px' }}>📥 {resourceAnalytics.downloads * 5} downloads</span>
                    )}
                  </div>
                )}
                <iframe
                  src={selectedResource.downloadUrl.replace('/view?usp=drive_link', '/preview').replace('/drive/folders/', '/embeddedfolderview?id=')}
                  title={selectedResource.title}
                  className="resource-iframe"
                  allow="autoplay"
                />
              </div>
              <div className="modal-footer">
                {selectedResource.type !== 'Reference Books' && (
                  <a
                    href={getDownloadLink(selectedResource.downloadUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-button"
                    download
                    onClick={(e) => {
                      trackResourceEvent(selectedResource, 'download').then(() => {
                        fetchResourceAnalytics(selectedResource.id).then(analytics => {
                          setResourceAnalytics(analytics);
                        });
                      });
                    }}
                  >
                    Download PDF
                  </a>
                )}
                <a
                  href={selectedResource.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="open-drive-button"
                >
                  Open in Google Drive
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourcesPage;