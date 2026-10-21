import React from 'react';
import Slider from "react-slick";
import './Testimonials.scss';

const testimonials = [
    {
        title: "Everything I Wanted",
        quote: "The site asked what mattered to me - placements, academics, campus life - and gave me options that fit my rank and my vibe. I didn’t think counselling could feel this personal.",
    },
    {
        title: "Found my place",
        quote: "I wanted a college that encouraged creativity and startups, but I didn’t want to compromise on the college vibe. This site showed me I didn’t have to.",
    },
    {
        title: "Not just cutoffs and ranks",
        quote: "Every other tool just showed me where I could get in. This helped me decide where I should. It felt more like guidance than a search filter.",
    },
    // {
    //     title: "Productivity Booster",
    //     quote: "I have never been so focused and productive when studying by myself before. I can study with someone basically 24/7 if I really wanted to. It has been an amazing help! 💜 Thanks Study Together!",
    // },
    // {
    //     title: "Goals",
    //     quote: "I've been a part of it for probably a little over a month and I've noticed how it's improved my ability to stay focused. Since everyone is also studying in the call and working hard, I feel obliged to stay on task as well.",
    // },
    // {
    //     title: "Productivity Booster",
    //     quote: "I have never been so focused and productive when studying by myself before. I can study with someone basically 24/7 if I really wanted to. It has been an amazing help! 💜 Thanks Study Together!",
    // },
    // {
    //     title: "Goals",
    //     quote: "I've been a part of it for probably a little over a month and I've noticed how it's improved my ability to stay focused. Since everyone is also studying in the call and working hard, I feel obliged to stay on task as well.",
    // },
];

const Testimonials = () => {
    const settings = {
        dots: true,
        arrows: false,
        infinite: testimonials.length > 3,
        speed: 500,
        slidesToShow: testimonials.length < 3 ? testimonials.length : 3,
        slidesToScroll: 1,
        autoplay: false,
        autoplaySpeed: 2000,

        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                },
            },
        ],
    };

    return (
        <section className="testimonials">
            <h2>What Our Students Say</h2>
            <Slider {...settings} className="testimonial-slider">
                {testimonials.map((t, index) => (
                    <div key={index} className="testimonial-card">
                        <h3>{t.title}</h3>
                        <p className="quote">"{t.quote}"</p>
                    </div>
                ))}
            </Slider>
        </section>
    );
};

export default Testimonials;
