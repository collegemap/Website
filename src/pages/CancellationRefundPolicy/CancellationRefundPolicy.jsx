import React from 'react';
import './CancellationRefundPolicy.scss';

const CancellationRefundPolicy = () => {
    return (
        <div className="cancellation-refund">
            <div className="container">
                <h1>Cancellation and Refund Policy</h1>
                <p className="last-updated">Effective Date: April 25, 2025</p>

                <section>
                    <p>
                        At CollegeMap, we are committed to providing students with the best possible guidance
                        in choosing the right college and branch. We value your satisfaction and strive to ensure a
                        smooth experience with our platform. This policy outlines our cancellation and refund
                        procedures for paid services.
                    </p>
                </section>

                <section>
                    <h2>Definitions</h2>
                    <ul>
                        <li><strong>Advanced Model:</strong> Custom built tool that gives personalized college suggestions based on student inputs.</li>
                        <li><strong>Career Counseling:</strong> One-on-one guidance from expert mentors to help students align their academic goals and preferences.</li>
                        <li><strong>Confirmed Counseling:</strong> A session is considered “confirmed” once CollegeMap assigns and shares the counselor’s details with the user.</li>
                    </ul>
                </section>

                <section>
                    <h2>Cancellation Policy</h2>
                    <ul>
                        <li><strong>Advanced Model Access:</strong> Once payment is made and the model results are displayed, the transaction is non-cancellable and non-refundable.</li>
                        <li><strong>Career Counseling:</strong> Users may cancel before counselor assignment confirmation. After confirmation, no cancellations will be accepted.</li>
                        <li><strong>Free Services:</strong> No cancellation required, as they do not involve payments.</li>
                    </ul>
                </section>

                <section>
                    <h2>Refund Policy</h2>
                    <h3>Refunds May Be Considered If:</h3>
                    <ul>
                        <li>There is a technical issue on our end that prevents access to the service and we are unable to resolve it within 48 hours.</li>
                        <li>A paid service was not delivered or confirmed (e.g., counselor not assigned, model not generated).</li>
                    </ul>

                    <h3>No Refunds Will Be Issued:</h3>
                    <ul>
                        <li>After Advanced Model results are shown.</li>
                        <li>After counselor assignment for Career Counseling is confirmed.</li>
                        <li>For dissatisfaction based on personal opinion or change of mind.</li>
                        <li>For incorrect user inputs (e.g., wrong rank or preferences).</li>
                        <li>For gateway transaction charges (if any).</li>
                        <li>For free services or trials.</li>
                    </ul>
                </section>

                <section>
                    <h2>User Responsibility</h2>
                    <ul>
                        <li>Providing accurate and truthful information.</li>
                        <li>Ensuring they meet all requirements for counseling or model access.</li>
                    </ul>
                    <p>Incorrect information may lead to suboptimal results and does not qualify for refunds.</p>
                </section>

                <section>
                    <h2>Abuse & Fraud Prevention</h2>
                    <ul>
                        <li>CollegeMap reserves the right to deny refunds for users found misusing services.</li>
                        <li>We may suspend accounts for repeated violations or fraudulent activity.</li>
                    </ul>
                </section>

                <section>
                    <h2>Force Majeure</h2>
                    <p>We are not liable for refunds or delays caused by circumstances beyond our control, including but not limited to:</p>
                    <ul>
                        <li>Internet or power outages</li>
                        <li>Natural disasters</li>
                        <li>Third-party platform failures</li>
                    </ul>
                </section>

                <section>
                    <h2>Policy Updates</h2>
                    <p>This policy may be updated at any time. Users are advised to check the latest version on our website before making any purchase.</p>
                </section>

                <section>
                    <h2>Refund Process</h2>
                    <ul>
                        <li>Email your refund request to <a href="mailto:collegemap123@gmail.com">collegemap123@gmail.com</a> with your registered email ID, payment receipt, and a clear explanation.</li>
                        <li>Approved refunds will be processed within 7 business days to the original payment method.</li>
                    </ul>
                </section>

                <section>
                    <h2>Governing Law</h2>
                    <p>This policy shall be governed by and construed in accordance with the laws of India. All disputes shall fall under the jurisdiction of courts located in Mumbai, Maharashtra.</p>
                </section>

                <section>
                    <h2>Need Help?</h2>
                    <p>For any queries or clarification, please reach out to us at <a href="mailto:support@collegemap.in">support@collegemap.in</a>. We're here to help!</p>
                </section>
            </div>
        </div>
    );
};

export default CancellationRefundPolicy;
