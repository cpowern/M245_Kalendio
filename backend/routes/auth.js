//auth.js
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { createCalendar, shareCalendar } = require('../googleCalendar');
const { google } = require('googleapis');
const crypto = require('crypto');
const Calendar = require('../models/Calendar'); // Modell für Kalender erstellen



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
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events.readonly', // Lesezugriff auf Events
            'profile',
            'email',
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
        const calendarId = await createCalendar(groupName);

        // 6-stelligen Code generieren
        const groupCode = crypto.randomBytes(3).toString('hex'); // Beispiel: 'a1b2c3'

        // Kalender-Daten in der Datenbank speichern
        const calendar = await Calendar.create({
            groupName,
            calendarId,
            groupCode,
        });

        console.log('Kalender-ID:', calendarId); // Hier loggen
        res.status(201).json({
            success: true,
            groupCode,
            calendarId, // Zurückgeben, um sie für spätere Schritte zu verwenden
            message: `Kalender '${groupName}' erfolgreich erstellt! Teilen Sie diesen Code: ${groupCode}`,
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

// Temporarily bypass authentication for debugging
router.get('/list-calendars', async (req, res) => {
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
            timeZone: cal.timeZone || 'No TimeZone',
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

    console.log(`Fetching events for calendarId: ${calendarId}`); // Debug log

    try {
        const response = await calendar.events.list({
            calendarId,
            timeMin: new Date().toISOString(), // Startzeit jetzt
            timeMax: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), // Endzeit in einem Jahr
            maxResults: 2500,
            singleEvents: true,
            orderBy: 'startTime',
        });

        console.log('Google Calendar API Response:', response.data); // Debugging

        if (!response.data.items || response.data.items.length === 0) {
            console.log(`Keine Events gefunden für KalenderID: ${calendarId}`);
            return res.status(200).json({ success: true, events: [] });
        }

        res.status(200).json({ success: true, events: response.data.items });
    } catch (error) {
        console.error('Fehler beim Abrufen der Events:', error.message);
        res.status(500).json({ success: false, message: 'Fehler beim Abrufen der Events.' });
    }
});

router.post('/join-calendar', async (req, res) => {
    const { groupCode } = req.body;

    if (!req.user) {
        console.log('Unauthorized request - req.user not found');
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Kalender aus der Datenbank abrufen
        const calendar = await Calendar.findOne({ groupCode });
        if (!calendar) {
            console.log('Calendar not found for groupCode:', groupCode);
            return res.status(404).json({ success: false, message: 'Kalender mit diesem Code nicht gefunden' });
        }

        const calendarId = calendar.calendarId;

        // Google Calendar API Client initialisieren
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        auth.setCredentials({
            refresh_token: process.env.REFRESHTOKEN,
        });

        const googleCalendar = google.calendar({ version: 'v3', auth });

        // Prüfen, ob der Benutzer bereits Zugriff hat
        const aclResponse = await googleCalendar.acl.list({ calendarId });
        const existingRule = aclResponse.data.items.find(
            (rule) => rule.scope.value === req.user.email
        );

        if (existingRule) {
            console.log('User already has access to the calendar.');
            return res.status(200).json({
                success: true,
                message: `Du hast bereits Zugriff auf den Kalender '${calendar.groupName}'.`,
                calendarId,
            });
        }

        // Zugriffsregel hinzufügen
        await googleCalendar.acl.insert({
            calendarId,
            requestBody: {
                role: 'writer',
                scope: {
                    type: 'user',
                    value: req.user.email,
                },
            },
        });

        res.status(200).json({
            success: true,
            message: `Erfolgreich dem Kalender '${calendar.groupName}' beigetreten!`,
            calendarId,
        });
    } catch (error) {
        console.error('Fehler beim Beitreten des Kalenders:', error.message);
        res.status(500).json({ success: false, message: 'Fehler beim Beitreten des Kalenders' });
    }
});

router.get('/test-auth', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({ success: true, user: req.user });
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
});



module.exports = router;