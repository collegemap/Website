import gmeet1 from '../../assets/GMeetphotos/gm1.jpg';
import gmeet2 from '../../assets/GMeetphotos/3.png';
import gmeet3 from '../../assets/GMeetphotos/gm3f.png';
import gmeet4 from '../../assets/GMeetphotos/gm5.jpg';
import gmeet5 from '../../assets/GMeetphotos/gm4.jpg';
import geetVerma from '../../assets/geetverma1.png'

const testimonials = [
  {
    name: 'Geet Sharma',
    batch: '2026(12th pass out)',
    text: '"CollegeMap really helped me during my prep. The 24/7 Google meets were really helpful in building consistency and as a person with ADHD I can confirm we do need a push which I was able to get from here."',
    image: geetVerma,
  },
];

const gmeetSessions = [
  {
    image: gmeet1,
    alt: "Live Google Meet doubt session",
    title: "Mentorship by IITians",
    // detail: "JEE 2026 Batch",
  },
  {
    image: gmeet2,
    alt: "Interactive Google Meet strategy session",
    title: "JEE Strategy",
    detail: "Discussion with IITians",
  },
  {
    image: gmeet3,
    alt: "Google Meet mock analysis session",
    title: "Mentorship by IITians",
    // detail: "Improvement Tips",
  },
  {
    image: gmeet4,
    alt: "Google Meet live revision session",
    title: "Group doubt-clearing session",
    // detail: "Important Topics",
  },
  {
    image: gmeet5,
    alt: "Google Meet guidance session",
    title: "College counselling session",
    // detail: "Personalized Study Plan",
  },
];

const marqueeGmeet = [...gmeetSessions, ...gmeetSessions];

const JoinFamily = () => {
  return (
    <section className="join-family">
      <div className="container">
        <h2 className="join-title">Join the CollegeMap Family</h2>
        <p className="join-description">
          Be part of a <strong>thriving community</strong> where students learn, grow, and achieve their <strong>IIT dreams</strong> together with <strong>IITian mentors</strong>.
        </p>

        {/* Scrolling Evidence Banner */}
        <div className="evidence-scroll-banner">
          <div className="scroll-track">
            <span className="scroll-item">50+ Live Google Meet Sessions</span>
            <span className="scroll-item">150+ Students Supported</span>
            <span className="scroll-item">10000+ Practice Questions</span>
            <span className="scroll-item">24/7 Doubt Support</span>
            <span className="scroll-item">IITian Mentors from Top IITs</span>
            <span className="scroll-item">Free Mock Tests & Analysis</span>
            {/* Duplicate for seamless loop */}
            <span className="scroll-item">50+ Live Google Meet Sessions</span>
            <span className="scroll-item">150+ Students Supported</span>
            <span className="scroll-item">10000+ Practice Questions</span>
            <span className="scroll-item">24/7 Doubt Support</span>
            <span className="scroll-item">IITian Mentors from Top IITs</span>
            <span className="scroll-item">Free Mock Tests & Analysis</span>
          </div>
        </div>

        {/* GMeet Sessions Evidence */}
        <div className="gmeet-evidence">
          <h3 className="evidence-heading">Interactive <strong>Google Meet</strong> Sessions</h3>
          <div className="gmeet-gallery">
            {gmeetSessions.map((session) => (
              <div className="gmeet-card" key={session.title}>
                <div className="gmeet-media">
                  <img
                    className="gmeet-image"
                    src={session.image}
                    alt={session.alt}
                    loading="lazy"
                  />
                </div>
                <p className="gmeet-caption"><strong>{session.title}</strong>{session.detail ? ` — ${session.detail}` : ""}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Student Testimonials */}
        <div className="student-testimonials">
          <h3 className="evidence-heading">What Our <strong>Students</strong> Say</h3>
          <div className="testimonials-grid">
            {testimonials.map((t, idx) => (
              <div key={idx} className="testimonial-card">
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={t.name}
                      className="testimonial-avatar"
                      style={{ border: '2px solid var(--primary)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                  )}
                  <div>
                    <strong>{t.name}</strong>
                    <span className="testimonial-batch">{t.batch}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="evidence-section">
          <div className="evidence-stats">
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Live Doubt Sessions</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">150+</div>
              <div className="stat-label">Students Supported</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10000+</div>
              <div className="stat-label">Practice Questions</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinFamily;