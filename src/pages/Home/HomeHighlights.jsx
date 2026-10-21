import React from 'react';

const HomeHighlights = () => (
  <section className="home-highlights">
    <div className="container">
      <div className="highlights-grid">
        <div className="highlight-item">
          <div className="highlight-icon"></div> {/*To be added Later*/}
          <div className="highlight-text">
            <h3>Live Mock Tests</h3>
          </div>
        </div>
        <div className="divider">|</div>
        <div className="highlight-item">
          <div className="highlight-icon"></div>
          <div className="highlight-text">
            <h3>100+ Free Notes and Resources</h3>
          </div>
        </div>
        <div className="divider">|</div>
        <div className="highlight-item">
          <div className="highlight-icon"></div>
          <div className="highlight-text">
            <h3>24 x 7 Doubts Solved</h3>
          </div>
        </div>
        <div className="divider">|</div>
        <div className="highlight-item">
          <div className="highlight-icon"></div>
          <div className="highlight-text">
            <h3>150+ Students Supported</h3>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HomeHighlights;