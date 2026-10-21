import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import './ContactUs.scss';
import ContactIllustration from '../../assets/contact-illustration.svg';

const ContactUs = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const googleFormActionUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfILAk2c9t9AofhWDlWT4sKM2Wx4deaTD-lpipkAnLFd6kzGA/formResponse';

        const googleFormData = new FormData();
        googleFormData.append('entry.1917690449', formData.name);
        googleFormData.append('entry.363307104', formData.email);
        googleFormData.append('entry.904682142', formData.subject);
        googleFormData.append('entry.585560953', formData.message);
        googleFormData.append('usp', 'pp_url');

        try {
            await fetch(googleFormActionUrl, {
                method: 'POST',
                body: googleFormData,
                mode: 'no-cors',
            });

            setShowPopup(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
            e.target.reset();

            setTimeout(() => setShowPopup(false), 3000);
        } catch (error) {
            console.error('Error submitting to Google Form:', error);
            alert('There was an error submitting your message. Please try again.');
        }
    };

    return (
        <div className="contact-us">
            <Helmet>
                <title>Contact CollegeMap | Get in Touch — Support & Feedback</title>
                <meta name="description" content="Have questions about CollegeMap? Contact us via email at support@collegemap.in or call +91-9326602765. We'd love to hear your feedback and collaboration ideas." />
                <link rel="canonical" href="https://collegemap.in/contact" />
            </Helmet>
            {showPopup && (
                <div className="contact-us__popup">
                    <div className="contact-us__popup-content">
                        <p>Thank you for reaching out to us! We will get back to you shortly. 💌</p>
                    </div>
                </div>
            )}

            <div className="contact-us__container">
                <div className="contact-us__info">
                    <img
                        src={ContactIllustration}
                        alt="Contact Us Illustration"
                        className="contact-us__illustration"
                    />
                    <h2 className="contact-us__heading">Get in Touch</h2>
                    <p className="contact-us__text">
                        We'd love to hear from you! Feel free to reach out with any questions, feedback, or collaboration opportunities.
                    </p>
                    <div className="contact-us__details">
                        <div className="contact-us__detail-item">
                            <i className="fas fa-map-marker-alt"></i>
                        </div>
                        <div className="contact-us__detail-item">
                            <i className="fas fa-envelope"></i>
                            <a href="mailto:support@collegemap.in">support@collegemap.in </a>
                        </div>
                        <div className="contact-us__detail-item">
                            <i className="fas fa-phone"></i>
                            <a href="tel:+919326602765">+91-9326602765</a>
                        </div>
                    </div>
                </div>

                <div className="contact-us__form-wrapper">
                    <h3 className="contact-us__form-heading">Send us a Message</h3>
                    <form className="contact-us__form" onSubmit={handleSubmit}>
                        <div className="contact-us__form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="contact-us__form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="contact-us__form-group">
                            <label htmlFor="subject">Subject</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="contact-us__form-group contact-us__form-group--textarea">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="5"
                                value={formData.message}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>
                        <button type="submit" className="contact-us__form__button">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;