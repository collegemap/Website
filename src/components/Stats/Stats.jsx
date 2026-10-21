import React from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import './Stats.scss';

const Stats = () => {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.4 });

    return (
        <section className="stats" ref={ref}>
            <div className="wave-svg-top">
                <svg viewBox="0 0 1440 150" preserveAspectRatio="none" width="100%" height="80">
                    <path
                        fill="#dff6ff"
                        fillOpacity="1"
                        d="
                        M0,100 
                        C120,20 240,180 360,100 
                        C480,20 600,180 720,100 
                        C840,20 960,180 1080,100 
                        C1200,20 1320,180 1440,100 
                        L1440,0 L0,0 Z"
                    />
                </svg>
            </div>

            <div className="content">
                <p className="headline">
                    <span className='Main-Heading' style={{ fontSize: "3rem" }}> The <strong>BIG</strong> Problem<br /></span>
                    <span>(Out of 500 people we surveyed)</span>
                </p>

                <div className="numbers">
                    <div>
                        <span>{inView && <CountUp end={65} duration={5} suffix="%" />}</span>
                        <p>did not take counselling</p>
                    </div>
                    <div>
                        <span>{inView && <CountUp end={26} duration={5} suffix="%" />}</span>
                        <p>paid more than Rs. 2000</p>
                    </div>
                    <div>
                        <span>{inView && <CountUp end={45} duration={5} suffix="%" />}</span>
                        <p>are satisfied with their college</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Stats;
