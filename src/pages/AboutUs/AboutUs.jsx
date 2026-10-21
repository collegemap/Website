import React from 'react';
import { Helmet } from 'react-helmet-async';
import './AboutUs.scss';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import vision from '../../assets/aboutus/vision.png';
import mission from '../../assets/aboutus/mission.png';
import usp from '../../assets/aboutus/usp.png';
import Team from "../../components/Team/Team";
import Banner from '../../components/Banner/Banner';
const SlideInSection = ({ children, direction = 'left' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const variants = {
        hidden: {
            opacity: 0,
            x: direction === 'left' ? -100 : 100,
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.8 },
        },
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={variants}
        >
            {children}
        </motion.div>
    );
};

const AboutUs = () => {
    return (
        <div className="about-us">
            <Helmet>
                <title>About CollegeMap | Our Mission, Vision & Team — Built by IITians</title>
                <meta name="description" content="Built by IITians to help future students make smarter college decisions." />
                <link rel="canonical" href="https://collegemap.in/AboutUs" />
            </Helmet>
            <Banner />
            {/* <section className="iit-section banner-section">
                <h2>By IITians for Future IITians</h2>
            </section> */}
            {/* <section className="intro">
                <h1>About Us</h1>
            </section> */}
            <section className="vision-mission">
                <SlideInSection direction="left">
                    <div className="item">
                        <img src={vision} alt="Vision" />
                        <div className="text">
                            <h2 className='Main-Heading'>Our Vision</h2>
                            <p>Encouraging the students of India for personal and national development</p>
                        </div>
                    </div>
                </SlideInSection>

                <SlideInSection direction="right">
                    <div className="item reverse">
                        <div className="text">
                            <h2 className='Main-Heading'>Our Mission</h2>
                            <p>Everything we do at CollegeMap, we believe in challenging the problems faced by students. We are doing this by helping engineering students to find the right college.</p>
                        </div>
                        <img src={mission} alt="Mission" />
                    </div>
                </SlideInSection>

                <SlideInSection direction="left">
                    <div className="item">
                        <img src={usp} alt="USP" />
                        <div className="text">
                            <h2 className='Main-Heading'>USP</h2>
                            <p><strong>CollegeMap is the only platform that turns your JEE rank into real, personalized IIT and branch insights — instantly. </strong>Unlike generic cutoff lists or outdated advice, we blend placement data, closing rank trends, and future potential to show you exactly where you belong. Built by IITians who cracked the code, CollegeMap isn’t just a guide — it’s your shortcut to a smarter, data-driven decision. No logins. No fluff. Just the clarity you need when it matters most.</p>
                        </div>
                    </div>
                </SlideInSection>
            </section>

            {/* 
            <section className="stats">
                <h2>Stats</h2>
                <div className="chart">
                    <img src={visionImg} alt="Stats Chart" />
                </div>
                <div className="figures">
                    <div className="figure">
                        <h3>2.1+ crore</h3>
                        <p>hours of LIVE learning</p>
                    </div>
                    <div className="figure">
                        <h3>10+ lakh</h3>
                        <p>monthly YouTube views</p>
                    </div>
                    <div className="figure">
                        <h3>25+ lakh</h3>
                        <p>doubts resolved on the app</p>
                    </div>
                    <div className="figure">
                        <h3>57+ countries</h3>
                        <p>where students take LIVE classes</p>
                    </div>
                </div>
            </section> */}
            <Team />
        </div>
    );
};

export default AboutUs;
