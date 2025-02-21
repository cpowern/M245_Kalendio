// routes/auth.js
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
            'https://www.googleapis.com/auth/calendar.events.readonly', // Lesezugriff
            'profile',
            'email',
        ],
        accessType: 'offline', // Refresh Token anfordern
        prompt: 'consent',     // Nutzer auffordern, Zustimmung zu geben
    })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Nach erfolgreichem Login weiterleiten
        res.redirect('http://localhost:5173/groupselection');
    }
);

// -----------------------------------------
// POST /create-calendar
// -----------------------------------------

router.post('/create-calendar', async (req, res) => {
    const { groupName } = req.body;
    if (!groupName) {
        return res.status(400).json({ success: false, message: 'Gruppenname fehlt!' });
    }

    try {
        console.log('📌 Erstelle Kalender:', groupName);
        const calendarId = await createCalendar(groupName);

        const groupCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        console.log('📌 Generierter Code:', groupCode);

        const calendar = await Calendar.create({
            groupName,
            calendarId,
            groupCode,
            owner: req.user._id,
            members: [req.user._id], // ← Hier den Ersteller direkt als Mitglied hinzufügen!
        });       

        console.log('✅ Kalender erfolgreich erstellt:', calendar);
        res.status(201).json({
            success: true,
            groupCode,
            calendarId,
            calendar,
        });
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Kalenders:', error);
        res.status(500).json({
            success: false,
            message: 'Interner Fehler beim Erstellen des Kalenders',
            error: error.message,
        });
    }
});


// -------------------
// (Restliche Routen) 
// -------------------

// List user's calendars (mit Auth-Check)
router.get('/list-calendars', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: process.env.REFRESHTOKEN });

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
    auth.setCredentials({ refresh_token: process.env.REFRESHTOKEN });

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
    auth.setCredentials({ refresh_token: process.env.REFRESHTOKEN });

    const calendar = google.calendar({ version: 'v3', auth });

    console.log(`Fetching events for calendarId: ${calendarId}`);

    try {
        const response = await calendar.events.list({
            calendarId,
            timeMin: new Date().toISOString(),
            timeMax: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            maxResults: 2500,
            singleEvents: true,
            orderBy: 'startTime',
        });

        console.log('Google Calendar API Response:', response.data);

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

// join-calendar
router.post('/join-calendar', async (req, res) => {
    const { groupCode } = req.body;
  
    if (!req.user) {
      console.log('Unauthorized request - req.user not found');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  
    try {
      const calendar = await Calendar.findOne({ groupCode });
      if (!calendar) {
        console.log('Calendar not found for groupCode:', groupCode);
        return res.status(404).json({ success: false, message: 'Kalender mit diesem Code nicht gefunden' });
      }
  
      const calendarId = calendar.calendarId;
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ refresh_token: process.env.REFRESHTOKEN });
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
  
      // Mitgliederzahl im Calendar-Dokument erhöhen
      await Calendar.updateOne(
        { calendarId: calendar.calendarId },
        { $inc: { membersCount: 1 } }
      );
  
      // Abfrage des aktualisierten Dokuments, um den neuen Mitgliederstand zu erhalten
      const updatedCalendar = await Calendar.findOne({ calendarId: calendar.calendarId });
      console.log(`Updated members count for calendar ${calendar.groupName}: ${updatedCalendar.membersCount}`);
  
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

// test-auth
router.get('/test-auth', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({ success: true, user: req.user });
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
});

module.exports = router;
