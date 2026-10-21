import React from 'react';
import './WhySection.scss';
import idealCollege from "../../assets/whySection/idea-college.png";
import advancedResults from "../../assets/whySection/advanced-results.png";
import mentoring from "../../assets/whySection/1-1-mentor.png"

const features = [
    {
        title: 'Find Your Ideal College',
        description: 'Get instant college suggestions for free, based on your performance.',
        image: idealCollege
    },
    {
        title: 'Unlock Advanced Results',
        description: 'Unlock deeper insights about your choices, at a low cost.',
        image: advancedResults
    },
    {
        title: '1-on-1 Mentoring',
        description: 'Talk directly to current students studying at IIT for personalized guidance.',
        image: mentoring
    }
];


const WhySection = () => {
    return (
        <section className="why">
            <h2 className='Main-Heading'>Why CollegeMap?</h2>
            <div className="feature-grid">
                {features.map((feature, index) => (
                    <div key={index} className="feature">
                        <div className={`feature-image-wrapper bg-${index}`}>
                            <img src={feature.image} alt={feature.title} />
                        </div>
                        <h4>{feature.title}</h4>
                        <p>{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default WhySection;
