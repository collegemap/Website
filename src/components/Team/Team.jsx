import React from 'react';
import './Team.scss';
import defaultphoto from "../../assets/default_photo.jpg";
import tanvi from "../../assets/Team/tanvi1.png";
import anuj from '../../assets/Team/anuj1.png';
import bhoomi from "../../assets/Team/bhoomi1.png";
import veera from "../../assets/Team/venkat1.png";
import paridhi from "../../assets/Team/paridhi1.png";
import lakshmi from "../../assets/Team/lakshmi1.png";
import moksh from "../../assets/Team/moksh1.png";
import adarsh from "../../assets/Team/adarsh1.png";

const teamMembers = [
    { iit: "IIT Bombay", name: 'Anuj Patel', role: 'Founder and CEO', img: anuj, url: "https://www.linkedin.com/in/anuj-patel-679550297/" },
    { iit: "IIT Indore", name: 'Tanvi Warvadekar', role: 'Strategic Advisor', img: tanvi, url: "https://www.linkedin.com/in/tanvi-warvadekar/" },
    { iit: "IIT Palakkad", name: 'Veera Venkat', role: 'Web Development Head', img: veera, url: "https://www.linkedin.com/in/veera-venkat-408178280/" },
    { iit: "IIT Palakkad", name: 'Adarsh Reddy', role: 'Lead web Developer', img: adarsh, url: "https://www.linkedin.com/in/adarsh-reddy-bb1b8b318/" },
    { iit: "IIT Palakkad", name: 'Lakshmi Prasanna', role: 'Web Developer', img: lakshmi, url: "https://www.linkedin.com/in/lakshmi-prasanna-n-068a28353" },
    { iit: "IIT Bombay", name: 'Paridhi Vatrey', role: 'Design lead', img: paridhi, url: "https://www.linkedin.com/in/paridhi-vatrey/" },
    { iit: "Dwarkadas J. Sanghvi College of Engineering", name: 'Moksh Lakhani', role: 'Social Media Manager', img: moksh, url: "https://www.linkedin.com/in/moksh-lakhani-243244251/" },
    { iit: "IIT Bombay", name: 'Bhoomi Singhvi', role: 'Strategic Partnerships Lead', img: bhoomi, url: "https://www.linkedin.com/in/bhoomisinghvi/" },
];

const Team = () => {
    const handleImageError = (e) => {
        e.target.src = defaultphoto;
    };

    return (
        <section className="team" id='Team'>

            {/* 4 dot corner spans */}
            <span className="dot-tl" aria-hidden="true" />
            <span className="dot-tr" aria-hidden="true" />
            <span className="dot-bl" aria-hidden="true" />
            <span className="dot-br" aria-hidden="true" />

            {/* Heading */}
            <div className="team-heading">
                <h2 className='Main-Heading'>Meet Our Team</h2>
                <p className="team-subtitle">Meet the genius minds behind CollegeMap</p>
            </div>

            {/* Cards */}
            <div className="team-grid">
                {teamMembers.map((member, index) => (
                    <div key={index} className="member">
                        <div className="photo">
                            <img
                                src={member.img}
                                alt={member.name}
                                onError={handleImageError}
                            />
                        </div>
                        <div className="card-body">
                            <h4>{member.name}</h4>
                            <h5 className='role'>{member.role}</h5>
                            <h6 className='member-itt'>{member.iit}</h6>
                            <a href={member.url} target='_blank' rel="noreferrer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#0077b7" viewBox="0 0 256 256">
                                    <path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24ZM96,176a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0ZM88,96a12,12,0,1,1,12-12A12,12,0,0,1,88,96Zm96,80a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140Z"></path>
                                </svg>
                            </a>
                        </div>
                    </div>
                ))}
            </div>

        </section>
    );
};

export default Team;