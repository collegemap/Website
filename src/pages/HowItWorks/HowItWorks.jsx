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
        <div className="how-it-works-ladder">
            <h2 className="main-heading">How It Works</h2>
            <p className="quote-block">
                We use data gathered manually from students of 3rd and 4th year across all IITs, to find out about the different branches.
                Along with this, we also predict the closing ranks of branches, using the data of past years to ensure that every possible branch is considered.
                The algorithm we developed then uses this data together to help you find the most suited branch.
            </p>
            <div className="ladder-container">
                {steps.map((step, index) => (
                    <div key={step.id} id={step.id} className={`ladder-step ${index % 2 === 0 ? "left" : "right"}`}>
                        <div className="step-card">
                            <div className="step-header">
                                <span className="step-number">Step {index + 1}</span>
                                <h3 className="step-title">{step.title}</h3>
                            </div>
                            <div className="step-content">
                                <span className="step-icon">{step.icon}</span>
                                <p>{step.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    );
};

export default HowItWorks;
