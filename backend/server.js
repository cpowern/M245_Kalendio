const express = require('express');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
require('./routes/auth'); // Updated path to auth.js
const connectDB = require('./config/db'); // Path to db.js

const app = express();
const PORT = 5173; // Set port to 5173

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Google Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication
        res.redirect('http://localhost:5173/dashboard'); // Redirect to your frontend dashboard route
    }
);

// Protected route example
app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).send({ message: 'Not authenticated' });
    }
    res.send({ message: `Welcome, ${req.user.name}` });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
