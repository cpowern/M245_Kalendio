import React from 'react';
import '../styles/LandingPage.css'; // Reuse the same CSS

const Login = () => {
    return (
        <div className="landing-page">
            <h1 className="title">Login</h1>
            <p className="subtitle">Enter your credentials to access Kalendio.</p>
            <button className="cta-button">Login</button>
        </div>
    );
};

export default Login;
