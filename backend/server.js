const express = require('express');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
const connectDB = require('./config/db'); // MongoDB connection
const authRoutes = require('./routes/auth'); // Import the auth routes

const app = express();
const PORT = 5000; // Change this from 5173

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(authRoutes); // Attach authentication routes

// Root Route
app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the Kalendio API' }); // JSON response for root URL
});

// Protected route example
app.get('/MainPage', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).send({ message: 'Not authenticated' });
    }
    res.send({ message: `Welcome, ${req.user.name}` });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
