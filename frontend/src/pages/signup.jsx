import React, { useState } from 'react';
import '../styles/Login.css'; // Reusing the same CSS
import axios from 'axios';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/signup', {
        name,
        email,
        password,
      });

      if (response.data.success) {
        console.log('Signup successful:', response.data.message);
        window.location.href = '/login'; // Redirect to login page
      } else {
        setError(response.data.message || 'Signup failed');
      }
    } catch (err) {
      console.error('Error during signup:', err);
      setError('An error occurred during signup. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Sign Up</h1>
        <p className="login-subtitle">Create your Kalendio account</p>
        {error && <p className="error-message">{error}</p>}
        <form className="login-form" onSubmit={handleSignUp}>
          <input
            type="text"
            placeholder="Name"
            className="login-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="login-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button">Sign Up</button>
        </form>
        <div className="divider">
          <span className="divider-line"></span>
          <span className="divider-text">or</span>
          <span className="divider-line"></span>
        </div>
        <button
          className="google-button"
          onClick={() => (window.location.href = 'http://localhost:5000/auth/google')}
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
