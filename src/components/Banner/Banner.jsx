import React from 'react';
import './Banner.scss';

const Banner = () => {
    return (
        <div className="banner">
            <div className="banner-text">
                <h1>
                    By <span className="glow">IITians,</span> for <span className="glow">Future IITians</span>
                </h1>
            </div>
        </div>
    );
};

export default Banner;
