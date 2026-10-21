import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudyResources = () => {
  const navigate = useNavigate();

  return (
    <section className="study-resources">
      <div className="container">
        <h2 className="section-title">Study Resources</h2>
        <p className="section-subtitle">Top quality resources for <strong>free</strong>,curated by <strong>IITians</strong></p>
        <div className="batches-grid">
          
          <div className="batch-card resource-card-1">
            <div className="batch-year resource-header-1">JEE Busters</div>
            <div className="batch-content">
              <h3 className="batch-title">Game of Strategy</h3>
              <p className="batch-description">Exclusive support resources to help you ACE in the game of JEE- only from the best IITians</p>
              <ul className="batch-features">
                <li>✓ JEE Mains syllabus tracker</li>
                <li>✓ Formula sheets</li>
                <li>✓ Strategic guidance resources</li>
                <li>✓ and much more...</li>
              </ul>
              <button className="batch-btn primary" onClick={() => navigate('/resources')}>Get TOP material</button>
            </div>
          </div>

          <div className="batch-card resource-card-2">
            <div className="batch-year resource-header-2">Short notes</div>
            <div className="batch-content">
              <h3 className="batch-title">Chapter-wise overview</h3>
              <p className="batch-description">Quick summary of all chapters for last minute revision</p>
              <ul className="batch-features">
                <li>✓ Chapter-wise coverage</li>
                <li>✓ Important formulas and diagrams</li>
                <li>✓ Mains to advanced level</li>
              </ul>
              <button className="batch-btn primary" onClick={() => navigate('/resources')}>FREE Short Notes</button>
            </div>
          </div>

          <div className="batch-card resource-card-3">
            <div className="batch-year resource-header-3">Practice Sheets</div>
            <div className="batch-content">
              <h3 className="batch-title">Chapter-wise worksheets</h3>
              <p className="batch-description">Exclusive worksheets with progressive difficulty, for TOP tier preparation</p>
              <ul className="batch-features">
                <li>✓ 150+ questions per chapter</li>
                <li>✓ Full coverage of every chapter</li>
                <li>✓ Regular updates</li>
              </ul>
              <button className="batch-btn primary" onClick={() => navigate('/resources')}>Start Practicing</button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default StudyResources;