import React, { useState } from 'react';
import './VideoEmbedComponent.scss';
import demo from "../../assets/demo.mp4"

const VideoEmbedComponent = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="video-embed-container">
            {/* Part 1: Smaller Embedded Video */}
            <div className="video-section">
                <h2 className="video-title">🎬 Watch a Demo to Get the Full Picture</h2>
                <div className="video-frame">
                    <video
                        src={demo}
                        title="Demo Video"
                        controls
                        playsInline
                    />
                </div>
            </div>

            {/* Modal Video Player */}
            {showModal && (
                <div className="video-modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        <iframe
                            src={demo}
                            title="Demo Video"
                            allow="autoplay; fullscreen"
                            frameBorder="0"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoEmbedComponent;
