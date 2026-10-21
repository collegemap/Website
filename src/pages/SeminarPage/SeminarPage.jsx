import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import './SeminarPage.scss';
import mentorImage from '../../assets/mentor.png';
import { submitSeminarBooking } from '../../services/supabaseService';

// You can replace these with actual icons from a library like react-icons
const CheckIcon = () => <span className="icon-check">✓</span>;
const PlusIcon = () => <span className="icon-plus">+</span>;

const SeminarPage = () => {
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    // --- FAQ Data ---
    const faqs = [
        { q: "How will I get the link to the live seminar?", a: "After you complete your free registration, the unique link to the online seminar will be sent to your registered email address. We will also send reminders before the session starts." },
        { q: "Why is this guidance session free?", a: "We believe that quality guidance should be accessible to all students. This seminar is part of our commitment to making JEE counselling easy and a great way to experience the value CollegeMap provides, at no cost to you." },
        { q: "Can my parents join the session with me?", a: "Yes, absolutely! We encourage parents to attend the session with their child. It's an opportunity for both of you to get clarity and understand the best preparation strategies." },
        { q: "Will there be recording for the entire session?", a: "A link to the recording will be sent to all registered participants a few hours after the live seminar." },
        { q: "Are all seminars live and interactive?", a: "Yes, all our seminars are live and interactive. You will be able to ask your questions directly to our speaker, an experienced IITian, during the Q&A session." }
    ];

    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = index => {
        if (openFaq === index) {
            setOpenFaq(null);
        } else {
            setOpenFaq(index);
        }
    };

    const handleContactFormChange = (e) => {
        const { name, value } = e.target;
        setContactForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await submitSeminarBooking(contactForm);
            
            setShowSuccess(true);
            // Clear the form
            setContactForm({
                name: '',
                email: '',
                phone: '',
            });
            setTimeout(() => setShowSuccess(false), 3000);
            
        } catch (error) {
            console.error('Network error:', error);
            alert('There was an error submitting your registration. Please try again or contact us directly.');
        }
    };

    return (
        <div className="seminar-page">
            {/* --- Hero Section --- */}
            <header className="hero-section">
                <p className="subtitle">By IITians, for Future IITians</p>
                <h1>Master Your <span className="highlight-text">JEE PREP</span>: The Ultimate Strategy Session.</h1>
                <p className="urgency"> Join our <span className="highlight-text">live online seminar</span> and learn proven techniques to ace your <span className="highlight-text">JEE</span>.</p>

                <div className="hero-details">
                    <div className="mentor-intro">
                        <img src={mentorImage} alt="IITian Mentor" className="mentor-photo" />
                        <h3>Meet Your Mentor</h3>
                        <p>Nilkrishna, A CS student from IIT Bombay, dedicated to helping you succeed</p>
                        <div className="social-proof">
                            <p><span className="highlight-text">JEE Mains:</span> AIR 1</p>
                            <p><span className="highlight-text">JEE Advanced:</span> AIR 94</p>
                        </div>
                    </div>
                    <div className="workshop-info">
                        <h2>What You'll Learn at the <span className="highlight-text">Seminar</span></h2>
                        <ul>
                            <li><CheckIcon /> Master a proven time management and study plan to optimize your preparation.</li>
                            <li><CheckIcon /> Learn exam-day strategies to manage pressure and boost your score.</li>
                            <li><CheckIcon /> Discover how to tackle high-weight topics and avoid common mistakes.</li>
                            <li><CheckIcon /> "Unlock expert insights into building a resilient mindset for success.</li>
                            <li><CheckIcon /> Ask your question directly to IIT Bombay students.</li>
                        </ul>
                        <div className="cta-box">
                            <p className="offer-ends">Special Offer Ends In: <b>{formatTime(timeLeft)}</b></p>
                            <a href="#contact" className="cta-button">REGISTER NOW FOR FREE</a>
                            
                            <p className="price"><s>₹499</s></p>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Who is this for Section --- */}
            <section className="target-audience">
                <h2>Is This  <span className="highlight-text">Guidance Session</span> For You?</h2>
                <div className="audience-columns">
                    <div className="audience-yes">
                        <h3>This Is <span className="highlight-text">For YOU</span> If...</h3>
                        <ul>
                            <li>You are a serious JEE aspirant looking for a proven preparation strategy.</li>
                            <li>You are struggling with time management or staying motivated.</li>
                            <li> You feel overwhelmed by the vast syllabus and want a clear roadmap.</li>
                            <li>You are ready to learn from someone who has successfully gone through the process.</li>
                        </ul>
                    </div>
                    <div className="audience-no">
                        <h3>This Is <span className="highlight-text">NOT</span> For You If...</h3>
                        <ul>
                            <li>You prefer to rely on guesswork instead of a data-backed plan.</li>
                            <li> You are not committed to putting in the hard work required for JEE.</li>
                            <li>You are already confident in your preparation and do not need expert guidance.</li>
                            <li> You are not open to learning new strategies from successful IITians.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- Testimonials Section --- */}
            <section className="testimonials">
                <h2>Thousands of Students Will Transform Their Confusion into Clarity</h2>
                <div className="testimonial-cards">
                    <div className="card">
                        <p>"The seminar helped me organize my study schedule better. I'm much more confident in my preparation now and feel I have a clear path forward."</p>
                        <div className="author" style={{ justifyContent: 'center', textAlign: 'center' }}>
                            <div>
                                <h4>Ananya S.</h4>
                                <p>Student, Preparing for Jee 2026</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <p>"The strategic study approach shared in the seminar improved my understanding significantly. My scores are steadily rising, and I finally feel ready for JEE."</p>
                        <div className="author" style={{ justifyContent: 'center', textAlign: 'center' }}>
                            <div>
                                <h4>Rohan K.</h4>
                                <p>Student, Preparing for Jee 2026</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <p>"I was ready to give up on JEE until this seminar. The practical study methods really changed my perspective. For the first time, I'm actually enjoying JEE prep!"</p>
                        <div className="author" style={{ justifyContent: 'center', textAlign: 'center' }}>
                            <div>
                                <h4>Priya V.</h4>
                                <p>Student, Preparing for Jee 2026</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* --- Bonuses Section --- */}
            <section id="pricing" className="bonuses-section">
                <h2>Follow us for more <span className="highlight-text">Updates</span>.</h2>
                <div className="social-links">
                    <Link to="https://www.instagram.com/collegemap.in/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <svg className="social-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                    </Link>
                    <Link to="https://www.linkedin.com/company/collegemap/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <svg className="social-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                    </Link>
                    <Link to="https://www.youtube.com/@CollegeMap-in" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                        <svg className="social-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
                    </Link>
                    <Link to="https://wa.link/lo05a1" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                        <svg className="social-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                    </Link>
                </div>
            </section>

            {/* --- Guarantee Section --- */}
            <section className="guarantee-section">
                <div className="guarantee-text">
                    <h2> High-Value Learning, No Cost.</h2>
                    <h3>Our 100% Satisfaction Guarantee</h3>
                    <p> We're committed to making quality guidance accessible to all. Join our live session to experience our unique approach to JEE preparation firsthand. We're confident the insights you'll gain will provide immense clarity for your journey.</p>
                     <a href="#contact" className="cta-button">SAVE MY SPOT</a>
                </div>
            </section>
            
            {/* --- FAQ Section --- */}
            <section className="faq-section">
                <h2>Frequently Asked <span className="highlight-text">Questions</span></h2>
                <div className="faq-list">
                    {faqs.map((faq, index) => (
                        <div className="faq-item" key={index}>
                            <div className="faq-question" onClick={() => toggleFaq(index)}>
                                {faq.q}
                                <PlusIcon />
                            </div>
                            {openFaq === index && (
                                <div className="faq-answer">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* --- Contact Us Section --- */}
            <section id="contact" className="contact-section">
                <div className="contact-container">
                    <div className="contact-info">
                        <h2>Ready to <span className="highlight-text">Transform Your Future?</span></h2>
                        <p> Register for our free seminar now. Fill out the form below and we'll send your session details to your email instantly.</p>
                        <div className="contact-details">
                            <div className="contact-item text-center">
                                <h4>📧 Email</h4>
                                <p>support@collegemap.in</p>
                            </div>
                        </div>
                    </div>

                    <div className="contact-form-container">
                        <form className="contact-form" onSubmit={handleContactSubmit}>
                            <h3>Reserve Your Spot</h3>

                            <div className="form-group">
                                <label htmlFor="name">Full Name*</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={contactForm.name}
                                    onChange={handleContactFormChange}
                                    required
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address*</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={contactForm.email}
                                    onChange={handleContactFormChange}
                                    required
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={contactForm.phone}
                                    onChange={handleContactFormChange}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                            <button type="submit" className="submit-button">
                                REGISTER FOR FREE
                            </button>

                            {showSuccess && (
                                <div className="success-message">
                                    ✅ Success! Your registration is complete. Check your email for session details.
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </section>
            
            {/* --- Sticky Footer CTA --- */}
            <div className="sticky-footer">
                <a href="#contact" className="cta-button">BOOK YOUR SPOT NOW</a>
            </div>
        </div>
    );
};

export default SeminarPage;