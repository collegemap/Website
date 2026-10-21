import React from 'react';
import './Footer.scss';
import { FaInstagram, FaLinkedin, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import logo from "../../assets/logo/collegeMapLogo.png";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__container">
                <div className="footer__section logo-section">
                    <img src={logo} alt="CollegeMap Logo" className="footer__logo" />
                </div>

                <div className="footer__section links-section">
                    <h4 className="footer__heading">CollegeMap</h4>
                    <ul className="footer__list">
                        <li className="footer__list-item"><a href="/" className="footer__link">Home</a></li>
                        <li className="footer__list-item"><a href="/Questionaire" className="footer__link">Find Your Branch</a></li>
                    </ul>
                </div>

                <div className="footer__section links-section">
                    <h4 className="footer__heading">About</h4>
                    <ul className="footer__list">
                        {/* <li className="footer__list-item"><a href="https://collegemap1.wordpress.com/" className="footer__link">IIT News</a></li> */}
                        <li className="footer__list-item"><a href="/ComingSoon" className="footer__link">IIT News</a></li>
                        <li className="footer__list-item"><a href="/HowItWorks" className="footer__link">How We Work?</a></li>
                        <li className="footer__list-item"><a href="/AboutUs" className="footer__link">About Us</a></li>
                        {/* <li className="footer__list-item"><a href="https://wa.link/lo05a1" className="footer__link">Talk to an IITian</a></li> */}
                        <li className="footer__list-item"><a href="/TalkToIITians" className="footer__link">Talk to an IITian</a></li>
                        <li className="footer__list-item"><a href="/contact" className="footer__link">Contact Us</a></li>
                    </ul>
                </div>

                <div className="footer__section links-section">
                    <h4 className="footer__heading">Legal</h4>
                    <ul className="footer__list">
                        <li className="footer__list-item"><a href="/Privacy-Policy" className="footer__link">Privacy Policy</a></li>
                        <li className="footer__list-item"><a href="/Terms-and-Conditions" className="footer__link">Terms & Conditions</a></li>
                        <li className="footer__list-item"><a href="/refund" className="footer__link">Cancellation &amp; Refund</a></li>
                    </ul>
                </div>

                <div className="footer__section social-section">
                    <h4 className="footer__heading">Follow us</h4>
                    <div className="footer__social-icons">
                        <a href="https://www.instagram.com/collegemap.in?igsh=MWNzemZpcGE3cmM0dw==" className="footer__social-link"><FaInstagram /></a>
                        <a href="https://www.linkedin.com/company/collegemap/" className="footer__social-link"><FaLinkedin /></a>
                        <a href="/ComingSoon" className="footer__social-link"><FaTelegramPlane /></a>
                        <a href="https://wa.link/lo05a1" className="footer__social-link"><FaWhatsapp /></a>
                        {/* <a href="/ComingSoon" className="footer__social-link"><FaInstagram /></a>
                        <a href="/ComingSoon" className="footer__social-link"><FaLinkedin /></a>
                        <a href="/ComingSoon" className="footer__social-link"><FaWhatsapp /></a> */}
                    </div>
                </div>
            </div>

            <div className="footer__bottom">
                <p className="footer__copyright">&copy; {new Date().getFullYear()} CollegeMap. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;