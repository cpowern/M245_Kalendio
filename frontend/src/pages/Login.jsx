import React from 'react';
import '../styles/Login.css'; // Ensure the CSS file is in the same directory or update the path accordingly.

const Login = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Login</h1>
        <p className="login-subtitle">Access your Kalendio calendar</p>
        <form className="login-form">
          <input type="email" placeholder="Email" className="login-input" required />
          <input type="password" placeholder="Password" className="login-input" required />
          <button type="submit" className="login-button">Sign In</button>
        </form>
        <div className="divider">
          <span className="divider-line"></span>
          <span className="divider-text">or</span>
          <span className="divider-line"></span>
        </div>
        <button
          className="google-button"
          onClick={() => window.location.href = '/google'}
        >
          <span className="google-icon">G</span> Sign in with Google
        </button>
        <p className="login-footer">
          Don’t have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
