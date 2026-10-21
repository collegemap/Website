import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PYQAdvancedPage.scss';
import { pyqData } from './PYQData';

const SHIFTS = ['All', 'Shift 1', 'Shift 2'];

const PYQAdvancedPage = () => {
  const [papers, setPapers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeYear, setActiveYear] = useState('All');
  const [activeSession, setActiveSession] = useState('All');
  const [activeShift, setActiveShift] = useState('All');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUrl, setModalUrl] = useState('');

  useEffect(() => {
    setPapers(pyqData);
    setFiltered(pyqData);
  }, []);

  // Derive unique years and sessions from data
  const years = ['All', ...Array.from(new Set(pyqData.map(p => p.year))).sort((a, b) => b - a)];
  const sessions = ['All', ...Array.from(new Set(pyqData.map(p => p.session)))];

  useEffect(() => {
    let result = papers;

    if (activeYear !== 'All') {
      result = result.filter(p => p.year === Number(activeYear));
    }

    if (activeSession !== 'All') {
      result = result.filter(p => p.session === activeSession);
    }

    if (activeShift !== 'All') {
      result = result.filter(p => p.shift === activeShift);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.date.toLowerCase().includes(q) ||
          String(p.year).includes(q) ||
          p.shift.toLowerCase().includes(q) ||
          p.session.toLowerCase().includes(q) ||
          p.exam.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    result = [...result].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return new Date(b.date) - new Date(a.date);
    });

    setFiltered(result);
  }, [papers, activeYear, activeSession, activeShift, searchQuery]);

  // Convert Google Drive share link to embeddable preview URL
  const toPreviewUrl = (url) => {
    if (!url) return '';
    const fileIdMatch = url.match(/\/d\/(.*?)(\/|$)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    return url;
  };

  const openModal = (title, url) => {
    setModalTitle(title);
    setModalUrl(toPreviewUrl(url));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalTitle('');
    setModalUrl('');
  };

  const getDownloadUrl = (url) => {
    if (!url) return '#';
    const fileIdMatch = url.match(/\/d\/(.*?)(\/|$)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
    return url;
  };

  const cardLabel = (paper) =>
    `${paper.exam} ${paper.year} – ${paper.date} (${paper.shift})`;

  return (
    <div className="pyq-page">
      {/* ── Header ─────────────────────────────── */}
      <motion.div
        className="pyq-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>JEE Advanced Previous Year Question Papers</h1>
        <p>Explore JEE Advanced question papers &amp; answer keys</p>
      </motion.div>

      {/* ── Search ─────────────────────────────── */}
      <div className="pyq-search-section">
        <div className="pyq-search-bar">
          <input
            type="text"
            placeholder="Search by year, date, shift..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* ── Filters ────────────────────────────── */}
      <div className="pyq-filter-section">
        <div className="pyq-filter-group">
          <h3>Year</h3>
          <div className="pyq-filter-buttons">
            {years.map((yr) => (
              <button
                key={yr}
                className={activeYear === String(yr) ? 'active' : ''}
                onClick={() => setActiveYear(String(yr))}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <div className="pyq-filter-group">
          <h3>Session</h3>
          <div className="pyq-filter-buttons">
            {sessions.map((s) => (
              <button
                key={s}
                className={activeSession === s ? 'active' : ''}
                onClick={() => setActiveSession(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="pyq-filter-group">
          <h3>Shift</h3>
          <div className="pyq-filter-buttons">
            {SHIFTS.map((sh) => (
              <button
                key={sh}
                className={activeShift === sh ? 'active' : ''}
                onClick={() => setActiveShift(sh)}
              >
                {sh}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results count ──────────────────────── */}
      <div className="pyq-results-count">
        {filtered.length} paper{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* ── Cards grid ─────────────────────────── */}
      <motion.div
        className="pyq-grid-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {filtered.length === 0 ? (
          <div className="pyq-no-results">
            <h3>No papers found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="pyq-grid">
            {filtered.map((paper) => (
              <motion.div
                key={paper.id}
                className="pyq-card"
                whileHover={{ boxShadow: '0 6px 20px rgba(0,0,0,0.12)', y: -1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="pyq-card-body">
                  <div className="pyq-card-info">
                    <h3 className="pyq-card-title">{cardLabel(paper)}</h3>
                    <p className="pyq-card-meta">3 hours · 75 Questions</p>
                  </div>

                  <div className="pyq-card-actions">
                    {paper.paperUrl ? (
                      <button
                        className="pyq-btn pyq-btn--paper"
                        onClick={() => openModal(`${cardLabel(paper)} — Question Paper`, paper.paperUrl)}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                        View Paper
                      </button>
                    ) : (
                      <button className="pyq-btn pyq-btn--disabled" disabled>
                        Paper Coming Soon
                      </button>
                    )}

                    {paper.answerUrl && (
                      <button
                        className="pyq-btn pyq-btn--answer"
                        onClick={() => openModal(`${cardLabel(paper)} — Answer Key`, paper.answerUrl)}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                        Answer Key
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── PDF Modal ──────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="pyq-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="pyq-modal"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pyq-modal-header">
                <h2>{modalTitle}</h2>
                <button className="pyq-modal-close" onClick={closeModal}>✕</button>
              </div>

              <div className="pyq-modal-body">
                <iframe
                  src={modalUrl}
                  title={modalTitle}
                  className="pyq-modal-iframe"
                  allow="autoplay"
                />
              </div>

              <div className="pyq-modal-footer">
                <a
                  href={getDownloadUrl(modalUrl)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pyq-btn pyq-btn--paper"
                >
                  Download PDF
                </a>
                <a
                  href={modalUrl.replace('/preview', '/view')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pyq-btn pyq-btn--answer"
                >
                  Open in Drive
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PYQAdvancedPage;
