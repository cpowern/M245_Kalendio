const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const router = express.Router();
const calendar = require('../googleCalendar');

// Route to fetch events
router.get('/events', async (req, res) => {
    try {
        const { data } = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: new Date().toISOString(),
            timeMax: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });
        res.json(data.items);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:5000/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });
                if (!user) {
                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0]?.value,
                        avatar: profile.photos[0]?.value || null,
                    });
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

// Serialize and Deserialize User
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Redirect to MainPage after successful login
        res.redirect('http://localhost:5173/MainPage');
    }
);

// Logout Route
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
});

module.exports = router;
