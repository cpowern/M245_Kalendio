import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css'; // Ensure this path is correct

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            {/* Decorative Icons */}
            <div className="decorative-icon icon-book">📚</div>
            <div className="decorative-icon icon-pencil">✏️</div>
            <div className="decorative-icon icon-clock">⏰</div>
            <div className="decorative-icon icon-calendar">📅</div>

            {/* Main Content */}
            <h1 className="title">Kalendio</h1>
            <p className="subtitle">
                Share your schedule plan in private, achieve together.
            </p>
            <button className="cta-button" onClick={() => navigate('/login')}>
                Try Out Kalendio
            </button>
        </div>
    );
};

export default LandingPage;
