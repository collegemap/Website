import React from "react";
import "./HowItWorks.scss";

const steps = [
    {
        step: "Step 1",
        id: "rank",
        title: "Enter Your Rank",
        icon: "⭐",
        description: "Start your journey by providing your rank - the foundation for discovering your best-fit IIT and branch.",
    },
    {
        step: "Step 2",
        id: "priorities",
        title: "Tell Us Your Priorities",
        icon: "✔️",
        description: "Help us understand what matters the most to you - placements, research, exposure - we tailor to your goals.",
    },
    {
        step: "Step 3",
        id: "algorithm",
        title: "How our Algorithm works",
        icon: "⚙️",
        description: "Our smart algorithm analyzes numerous data points to bring you the most optimised and personalised choices.",
    },
    {
        step: "Step 4",
        id: "bestfit",
        title: "Get Your Best-Fit IIT & Branch",
        icon: "🏛️",
        description: "Receive curated options that align perfectly with your preferences, aspirations, and performance.",
    },
    {
        step: "Step 5",
        id: "guidance",
        title: "Expert Guidance by IITians",
        icon: "👤",
        description: "Backed by real experiences - IITians guide you at every step with clarity and confidence.",
    },
    {
        step: "Step 6",
        id: "finalized",
        title: "Your Perfect Choice, Finalized!",
        icon: "✅",
        description: "Walk in complete clarity, knowing your final choice is the best match for your future.",
    },
];

const HowItWorks = () => {

    return (
        <div className="how-it-works-workbook">
            <h2 className="main-heading">How It Works</h2>

            {steps.map((step, index) => (
                <div key={step.id} id={step.id} className="workbook-step">
                    <div className="step-header">
                        <span className="step-number">Step {index + 1}</span>
                        <h3 className="step-title">{step.title}</h3>
                    </div>
                    <div className="step-content">
                        <div className="step-icon">{step.icon}</div>
                        <p>{step.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HowItWorks;
