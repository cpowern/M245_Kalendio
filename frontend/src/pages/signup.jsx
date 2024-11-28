import React from 'react';
import '../styles/Login.css'; // CSS wird wiederverwendet

const Signup = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Sign Up</h1>
        <p className="login-subtitle">Create your Kalendio account</p>
        <form className="login-form">
          <input type="text" placeholder="Name" className="login-input" required />
          <input type="email" placeholder="Email" className="login-input" required />
          <input type="password" placeholder="Password" className="login-input" required />
          <input type="password" placeholder="Confirm Password" className="login-input" required />
          <button type="submit" className="login-button">Sign Up</button>
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
          <span className="google-icon">G</span> Sign up with Google
        </button>
        <p className="login-footer">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
