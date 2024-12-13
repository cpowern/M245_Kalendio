//auth.js
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { createCalendar, shareCalendar } = require('../googleCalendar');

require('dotenv').config();
const router = express.Router();

// Google Strategy konfigurieren
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

// Benutzer serialisieren
passport.serializeUser((user, done) => done(null, user.id));

// Benutzer deserialisieren
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Authentifizierungsrouten
router.get(
    '/google',
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/calendar', // Google Calendar API - Vollzugriff
            'profile', // Zugriff auf grundlegende Profildaten
            'email', // Zugriff auf E-Mail-Adresse
        ],
        accessType: 'offline', // Refresh Token anfordern
        prompt: 'consent', // Nutzeraufforderung erzwingen
    })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Nach erfolgreichem Login auf /groupselection weiterleiten
        res.redirect('http://localhost:5173/groupselection');
    }
);

router.post('/create-calendar', async (req, res) => {
    const { groupName } = req.body;

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Kalender erstellen (auf Peters Konto)
        const calendarId = await createCalendar(groupName);

        // Schreibrechte an den aktuellen Benutzer vergeben
        const userEmail = req.user.email; // Angemeldeter Nutzer
        await shareCalendar(calendarId, userEmail);

        res.status(201).json({
            success: true,
            calendarId,
            message: `Kalender '${groupName}' erfolgreich erstellt und geteilt!`,
        });
    } catch (error) {
        console.error('Fehler bei der Kalendererstellung:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Erstellen des Kalenders',
        });
    }
});

// List user's calendars
router.get('/list-calendars', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
        refresh_token: process.env.REFRESHTOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const response = await calendar.calendarList.list();
        const calendars = response.data.items.map((cal) => ({
            id: cal.id,
            summary: cal.summary,
        }));
        res.status(200).json({ success: true, calendars });
    } catch (error) {
        console.error('Error fetching calendar list:', error.message);
        res.status(500).json({ success: false, message: 'Error fetching calendar list' });
    }
});


// List events for a specific calendar
router.get('/events/:calendarId', async (req, res) => {
    const { calendarId } = req.params;

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
        refresh_token: process.env.REFRESHTOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const response = await calendar.events.list({
            calendarId,
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });
        console.log('Fetched events:', response.data.items); // Log for debugging
        res.status(200).json({ success: true, events: response.data.items });
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
});

module.exports = router;