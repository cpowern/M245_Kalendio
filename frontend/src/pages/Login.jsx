import React from 'react';
import '../styles/Login.css';

const Login = () => {
    const handleGoogleSignIn = () => {
        window.location.href = 'http://localhost:5000/auth/google'; // Redirect to Google OAuth
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1 className="login-title">Login</h1>
                <p className="login-subtitle">Access your Kalendio calendar</p>
                <button className="google-button" onClick={handleGoogleSignIn}>
                    <span className="google-icon">G</span> Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default Login;
