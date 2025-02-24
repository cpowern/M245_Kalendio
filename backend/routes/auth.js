// routes/auth.js

const express = require('express');
const authRouter = express.Router(); // Nur EIN Router-Objekt
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { createCalendar, shareCalendar } = require('../googleCalendar');
const { google } = require('googleapis');
const crypto = require('crypto');
const Calendar = require('../models/Calendar');

require('dotenv').config();

// -----------------------------------------
// Google OAuth Strategy
// -----------------------------------------
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

// -----------------------------------------
// Google OAuth-Routen (auf authRouter registriert)
// -----------------------------------------

// 1) /auth/google
authRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'profile',
      'email',
    ],
    accessType: 'offline',
    prompt: 'consent',
  })
);

// 2) /auth/google/callback
authRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Nach erfolgreichem Login
    res.redirect('http://localhost:5173/groupselection'); 
  }
);

// -----------------------------------------
// POST /create-calendar
// -----------------------------------------
authRouter.post('/create-calendar', async (req, res) => {
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
      members: [req.user._id], // Ersteller direkt als Mitglied
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

// -----------------------------------------
// (Beispiel für Kalender-Routen)
// -----------------------------------------

// /auth/list-calendars  => Nur als Beispiel; 
// ACHTUNG: Dies ist identisch mit /list-calendars in deinem Code.
// Wenn du das doppelt hast, kann es kollidieren!
authRouter.get('/list-calendars', async (req, res) => {
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

// /auth/events/:calendarId
authRouter.get('/events/:calendarId', async (req, res) => {
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
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(200).json({ success: true, events: [] });
    }

    res.status(200).json({ success: true, events: response.data.items });
  } catch (error) {
    console.error('Fehler beim Abrufen der Events:', error.message);
    res.status(500).json({ success: false, message: 'Fehler beim Abrufen der Events.' });
  }
});

// -----------------------------------------
// join-calendar
// -----------------------------------------
authRouter.post('/join-calendar', async (req, res) => {
  const { groupCode } = req.body;
  if (!req.user) {
    console.log('Unauthorized request - req.user not found');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const calendar = await Calendar.findOne({ groupCode });
    if (!calendar) {
      console.log('Calendar not found for groupCode:', groupCode);
      return res.status(404).json({ success: false, message: 'Kalender nicht gefunden' });
    }

    // Falls User nicht Mitglied ist -> beitreten
    if (!calendar.members.includes(req.user._id)) {
      calendar.members.push(req.user._id);
      await calendar.save();

      req.user.joinedCalendars.push(calendar._id);
      await req.user.save();
    }

    res.status(200).json({
      success: true,
      message: `Kalender '${calendar.groupName}' beigetreten!`,
      calendar,
    });
  } catch (error) {
    console.error('Fehler beim Beitreten:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Beitreten des Kalenders' });
  }
});

// -----------------------------------------
// test-auth
// -----------------------------------------
authRouter.get('/test-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ success: true, user: req.user });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

// -----------------------------------------
// Middleware ensureAuthenticated
// -----------------------------------------
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Unauthorized' });
};

// -----------------------------------------
// Exporte
// -----------------------------------------

authRouter.get('/logout', (req, res) => {
  req.logout((err) => {
      if (err) return res.status(500).json({ success: false, message: "Logout failed" });
      req.session.destroy(() => {
          res.clearCookie("connect.sid", { path: "/" }); // 🔹 Destroy session cookie
          res.status(200).json({ success: true, message: "Logged out successfully" });
      });
  });
});



module.exports = {
  authRouter,
  ensureAuthenticated,
};
