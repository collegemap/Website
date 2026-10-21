import React from "react";
import { Helmet } from 'react-helmet-async';
import "./StudyWithIITians.css";
import thumbnailOne from "../../assets/Thumbnails/yt1.jpeg";
import thumbnailTwo from "../../assets/Thumbnails/yt2.jpeg";
import thumbnailThree from "../../assets/Thumbnails/yt3.jpeg";
import thumbnailFour from "../../assets/Thumbnails/yt4.jpeg";
import thumbnailFive from "../../assets/Thumbnails/yt5.jpeg";
import thumbnailSix from "../../assets/Thumbnails/yt6.jpeg";
import thumbnailSeven from "../../assets/Thumbnails/yt7.jpeg";


const EXTERNAL_LINKS = {
	youtube: "https://www.youtube.com/@CollegeMap-in?sub_confirmation=1",
	community:
		"https://chat.whatsapp.com/Jv5KBBAeP62L9EzNqHHmwr?mode=ems_copy_t",
	availability: "https://wa.link/7dgukf",
	talkToIITian: "https://wa.link/1j0y0o",
};

const communityPoints = [
	"Get in touch with IITians",
	"Ask all your doubts",
	"Learn best techniques for JEE",
];

const highFocusPoints = [
	"Set daily goals and work",
	"Peer learning and encouragement",
	"Support and guidance by IITians",
];

const youtubeThumbnails = [
	{
		src: thumbnailOne,
		alt: "YouTube session thumbnail: Self study session",
	},
	{
		src: thumbnailTwo,
		alt: "YouTube session thumbnail: FAQ session",
	},
	{
		src: thumbnailThree,
		alt: "YouTube session thumbnail: Mocktest series",
	},
	{
		src: thumbnailFour,
		alt: "YouTube session thumbnail: Avoid these mistakes",
	},
	{
		src: thumbnailFive,
		alt: "YouTube session thumbnail: Life at IIT BOMBAY",
	},
	{
		src: thumbnailSix,
		alt: "YouTube session thumbnail: Here's my score",
	},
	{
		src: thumbnailSeven,
		alt: "YouTube session thumbnail: Comeback plan",
	}

];

const marqueeSessions = [...youtubeThumbnails, ...youtubeThumbnails];

const WhatsAppIcon = () => (
	<svg
		className="swi-icon"
		viewBox="0 0 24 24"
		aria-hidden="true"
		focusable="false"
	>
		<path
			fill="currentColor"
			d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2C6.6 2 2.18 6.42 2.18 11.85c0 1.74.45 3.43 1.31 4.93L2 22l5.39-1.41a9.84 9.84 0 0 0 4.64 1.18h.01c5.43 0 9.85-4.42 9.85-9.85A9.8 9.8 0 0 0 19.05 4.91zm-7.01 15.2h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.2.84.85-3.12-.2-.32a8.18 8.18 0 0 1-1.25-4.33c0-4.52 3.68-8.2 8.21-8.2 2.19 0 4.25.85 5.8 2.4a8.14 8.14 0 0 1 2.4 5.8c0 4.53-3.68 8.22-8.21 8.22zm4.5-6.15c-.25-.13-1.48-.73-1.71-.81-.23-.08-.4-.13-.56.13-.17.25-.65.81-.8.98-.15.17-.3.19-.56.06-.25-.13-1.08-.4-2.05-1.28-.76-.68-1.28-1.52-1.43-1.77-.15-.25-.02-.39.11-.52.12-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.77-1.84-.2-.48-.41-.41-.56-.42l-.48-.01c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.76 2.69 4.27 3.77.6.26 1.06.41 1.43.52.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.17.21-.58.21-1.07.15-1.17-.07-.09-.24-.15-.5-.29z"
		/>
	</svg>
);

const YouTubeIcon = () => (
	<svg
		className="swi-icon"
		viewBox="0 0 24 24"
		aria-hidden="true"
		focusable="false"
	>
		<path
			fill="currentColor"
			d="M23.5 7.2a3 3 0 0 0-2.1-2.12C19.54 4.57 12 4.57 12 4.57s-7.54 0-9.4.51A3 3 0 0 0 .5 7.2 31.58 31.58 0 0 0 0 12a31.58 31.58 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.12c1.86.5 9.4.5 9.4.5s7.54 0 9.4-.5a3 3 0 0 0 2.1-2.12A31.58 31.58 0 0 0 24 12a31.58 31.58 0 0 0-.5-4.8zM9.6 15.08V8.92L15.2 12z"
		/>
	</svg>
);

const StudyWithIITian = () => {
	return (
		<main className="study-with-iitians-page">
			<Helmet>
				<title>Study With IITians | JEE Community, Live Sessions & Study Groups — CollegeMap</title>
				<meta name="description" content="Join CollegeMap's free JEE study community. Study alongside IITians through live YouTube sessions, WhatsApp groups, and peer learning networks designed to accelerate your JEE prep." />
				<link rel="canonical" href="https://collegemap.in/StudyWithIITians" />
			</Helmet>
			<section className="swi-layout">
				<p className="swi-page-label">Study With IITians</p>
				<div className="swi-panel">
					<h1 className="swi-title">Top level guidance - From the top of the nation</h1>

					<div className="swi-cards-grid">
						<article className="swi-card">
							<h2>Join Our Community</h2>
							<ul className="swi-list">
								{communityPoints.map((point) => (
									<li key={point}>{point}</li>
								))}
							</ul>
							<a
								className="swi-action-btn"
								href={EXTERNAL_LINKS.community}
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Join CollegeMap community on WhatsApp"
							>
								<WhatsAppIcon />
								<span>Join for FREE</span>
							</a>
						</article>

						<article className="swi-card">
							<h2>Live Paper Attempts</h2>
							<ul className="swi-list">
								{highFocusPoints.map((point) => (
									<li key={point}>{point}</li>
								))}
							</ul>
							<a
								className="swi-action-btn"
								href={EXTERNAL_LINKS.availability}
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Check mentorship availability on WhatsApp"
							>
								<WhatsAppIcon />
								<span>Check availability</span>
							</a>
						</article>
					</div>

					<a
						className="swi-youtube-row"
						href={EXTERNAL_LINKS.youtube}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Visit CollegeMap YouTube channel"
					>
						<YouTubeIcon />
						<span>Join us on YouTube for interactive live discussions</span>
					</a>

					<div className="swi-divider" />

					<section className="swi-marquee-section">
						<p className="swi-marquee-title">Live sessions and strategy videos from IITians</p>
						<p className="swi-marquee-subtitle">Click any card to open our YouTube channel</p>

						<div className="swi-marquee-mask" aria-label="Scrolling YouTube sessions">
							<div className="swi-marquee-track">
								{marqueeSessions.map((session, index) => (
									<a
										key={`${session.src}-${index}`}
										className="swi-thumbnail-card"
										href={EXTERNAL_LINKS.youtube}
										target="_blank"
										rel="noopener noreferrer"
									>
										<img
											className="swi-thumbnail-image"
											src={session.src}
											alt={session.alt}
											loading="lazy"
										/>
									</a>
								))}
							</div>
						</div>
					</section>

					<div className="swi-divider" />

					<section className="swi-talk-section">
						<h2>Connect with an IITian</h2>
						<a
							className="swi-action-btn"
							href={EXTERNAL_LINKS.talkToIITian}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Talk to an IITian on WhatsApp"
						>
							<WhatsAppIcon />
							<span>Click here</span>
						</a>
					</section>
				</div>
			</section>
		</main>
	);
};

export default StudyWithIITian;
