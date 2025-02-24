import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Login.css';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleGoogleSignIn = () => {
        setLoading(true); // Show loading state
        axios.get('http://localhost:5000/auth/test-auth', { withCredentials: true })
            .then((res) => {
                if (res.data.success) {
                    setTimeout(() => navigate('/groupselection'), 1000); // 🔹 Delay for UX
                } else {
                    window.location.href = 'http://localhost:5000/auth/google'; // Redirect to Google OAuth
                }
            })
            .catch(() => {
                window.location.href = 'http://localhost:5000/auth/google'; // Redirect if session fails
            });
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1 className="login-title">Login</h1>
                <p className="login-subtitle">Access your Kalendio calendar</p>

                <button className="google-button" onClick={handleGoogleSignIn} disabled={loading}>
                    {loading ? "Checking session..." : <><span className="google-icon">G</span> Sign in with Google</>}
                </button>
            </div>
        </div>
    );
};

export default Login;
