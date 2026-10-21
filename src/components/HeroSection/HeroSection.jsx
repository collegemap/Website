import React from "react";
import "./HeroSection.scss";
import HeroImage from "../../assets/Hero.png";

const HeroSection = () => {
    return (
        <section className="hero">
            <div className="hero-container">
                <div className="hero-left">
                    <img src={HeroImage} alt="Confused Students" />
                </div>
                <div className="hero-right">
                    <h1 className="Main-Heading">
                        Welcome To CollegeMap!
                    </h1>
                    <p>
                        Confused about which IIT or branch to choose after JEE? You're not alone!
                        <br></br>
                        <br></br>
                        <strong>CollegeMap</strong> is built <strong>by IITians, for future IITians</strong>, to help you make smarter decisions based on real data — not just guesswork. Whether you're trying to understand past cutoffs, compare placements, or find the best fit for your rank, we've got you covered.
                    </p>
                    <p className="bold">No login/signup required.</p>
                    <button className="cta-button"><a href="/Questionaire">Try for FREE!</a></button>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
