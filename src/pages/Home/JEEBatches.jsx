import React from 'react';

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const JEEBatches = () => (
  <section className="jee-batches">
    <div className="container">
      <h2 className="section-title">JEE Student Communities</h2>
      <p className="section-subtitle">Join a <strong>free WhatsApp community</strong> of aspirants &amp; IITian mentors for your target year</p>
      <div className="batches-grid">
        
        {/* JEE 2026 */}
        <div className="batch-card batch-2026">
          <div className="batch-year">JEE 2027</div>
          <div className="batch-content">
            <h3 className="batch-title">For <strong>Class 12</strong> &amp; Drop Year Aspirants</h3>
            <p className="batch-description">Connect with <strong>fellow JEE aspirants</strong> and <strong>IITians</strong> for last-mile preparation support, doubt solving, and strategy discussions.</p>
            <ul className="batch-features">
              <li>✓ <strong>Peer-to-Peer</strong> Doubt Solving</li>
              <li>✓ Free <strong>Mock Tests</strong> &amp; Assessments</li>
              <li>✓ Ask <strong>IITians</strong> Directly</li>
              <li>✓ Share <strong>Strategies</strong> &amp; Tips</li>
            </ul>
            <a href="https://chat.whatsapp.com/E81KGIjOLuI1NfAO8AVLVI"target="_blank" rel="noopener noreferrer" className="batch-btn primary">
              <WhatsAppIcon /> Join now
            </a>
          </div>
        </div>

        {/* JEE 2027 */}
        <div className="batch-card batch-2027">
          <div className="batch-year">JEE 2028</div>
          <div className="batch-content">
            <h3 className="batch-title">For <strong>Class 11</strong> Aspirants</h3>
            <p className="batch-description">Start your JEE journey early with a <strong>supportive community</strong> of like-minded students and <strong>IITian mentors</strong>.</p>
            <ul className="batch-features">
              <li>✓ Connect with <strong>Fellow Aspirants</strong></li>
              <li>✓ Regular <strong>Practice Tests</strong></li>
              <li>✓ Guidance from <strong>IITians</strong></li>
              <li>✓ <strong>Doubt Clearing</strong> Support</li>
            </ul>
            <a href="https://chat.whatsapp.com/FFvn8Ogz4Sd4GgTphd7qfO" target="_blank" rel="noopener noreferrer" className="batch-btn primary">
              <WhatsAppIcon /> Join now
            </a>
          </div>
        </div>

        {/* JEE 2028 */}
        <div className="batch-card batch-2028">
          <div className="batch-year">JEE 2029</div>
          <div className="batch-content">
            <h3 className="batch-title">For <strong>Class 10</strong> Aspirants</h3>
            <p className="batch-description">Begin your <strong>IIT journey early</strong> — build habits, get motivated, and connect with <strong>peers &amp; mentors</strong>.</p>
            <ul className="batch-features">
              <li>✓ Build <strong>Study Habits</strong> Early</li>
              <li>✓ <strong>Community</strong> Learning</li>
              <li>✓ Access to <strong>Mock Tests</strong></li>
              <li>✓ <strong>Guidance</strong> &amp; Motivation</li>
            </ul>
            <a href="https://chat.whatsapp.com/IfWG0MVDSim68pZrtHkeXd?s=cl&p=a&mlu=0" target="_blank" rel="noopener noreferrer" className="batch-btn primary">
              <WhatsAppIcon /> Join now
            </a>
          </div>
        </div>

      </div>
    </div>
  </section>
);

export default JEEBatches;