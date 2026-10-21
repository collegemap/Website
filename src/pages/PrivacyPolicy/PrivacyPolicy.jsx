import React from 'react';
import './PrivacyPolicy.scss';

const PrivacyPolicy = () => {
    return (
        <div className="privacy-policy">
            <div className="container">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last updated: April 25, 2025</p>

                <section>
                    <h2>Introduction</h2>
                    <p>
                        At CollegeMap, your privacy is our priority. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
                    </p>
                </section>

                <section>
                    <h2>Information We Collect</h2>
                    <ul>
                        <li>Personal identification details (e.g., name, email, phone number)</li>
                        <li>Academic preferences and performance data</li>
                        <li>Usage data such as browser type, time spent, and pages visited</li>
                    </ul>
                </section>

                <section>
                    <h2>How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul>
                        <li>Provide personalized college and career guidance</li>
                        <li>Improve our services and tools</li>
                        <li>Respond to your queries and provide support</li>
                        <li>Send important updates or promotional materials (you can opt-out anytime)</li>
                    </ul>
                </section>

                <section>
                    <h2>Data Sharing and Disclosure</h2>
                    <p>
                        We do not sell or rent your data. Information may be shared with trusted partners only to facilitate service delivery, and only under strict confidentiality agreements.
                    </p>
                </section>

                <section>
                    <h2>Data Security</h2>
                    <p>
                        We implement industry-standard security measures including encryption, access controls, and regular audits to protect your data from unauthorized access or breaches.
                    </p>
                </section>

                <section>
                    <h2>Cookies and Tracking</h2>
                    <p>
                        We use cookies to enhance your experience. You can manage cookie preferences through your browser settings.
                    </p>
                </section>

                <section>
                    <h2>Your Rights</h2>
                    <ul>
                        <li>Access, update, or delete your personal data</li>
                        <li>Withdraw consent for data processing</li>
                        <li>Raise concerns with our Data Protection Officer</li>
                    </ul>
                </section>

                <section>
                    <h2>Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy periodically. Any major changes will be communicated via email or in-app notifications.
                    </p>
                </section>

                <section>
                    <h2>Contact Us</h2>
                    <p>
                        For any questions, reach out to <a href="mailto:support@collegemap.in">support@collegemap.in</a>
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
