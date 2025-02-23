//api.js
const express = require('express');
const { google } = require('googleapis');
const Task = require('../models/Task'); // Ensure Task model is imported
require('dotenv').config();
const router = express.Router();
const User = require('../models/User'); // Füge das hinzu!
const Calendar = require('../models/Calendar'); // Importiere das Calendar Model

const { ensureAuthenticated } = require('../routes/auth');

if (!ensureAuthenticated) {
    console.error("❌ ERROR: ensureAuthenticated is undefined!");
}

// Endpoint to list user calendars
router.get('/list-calendars', ensureAuthenticated, async (req, res) => {
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

// Endpoint to fetch events from a specific calendar
router.get('/events/:calendarId', ensureAuthenticated, async (req, res) => {
    const { calendarId } = req.params;

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
            maxResults: 2500,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items;

        if (!events || events.length === 0) {
            console.log(`No events found for calendarId: ${calendarId}`);
            return res.status(200).json({ success: true, events: [] });
        }

        console.log(`Fetched events for calendarId: ${calendarId}`, events); // Log full response for debugging

        // Save events to MongoDB
        for (const event of events) {
            const taskData = {
                calendarId,
                title: event.summary || 'No Title',
                description: event.description || '',
                date: event.start.dateTime || event.start.date,
            };

            await Task.updateOne(
                { calendarId, title: taskData.title, date: taskData.date },
                { $set: taskData },
                { upsert: true }
            );

            console.log(`Saved task: ${taskData.title} for date ${taskData.date}`);
        }

        res.status(200).json({ success: true, events });
    } catch (error) {
        console.error('Error fetching or saving events:', error.response?.data || error.message); // Log detailed error
        res.status(500).json({ success: false, message: 'Error fetching or saving events' });
    }
});

router.get('/user-calendars', ensureAuthenticated, async (req, res) => {
    try {
        console.log('📌 Lade Kalender für User:', req.user._id);
        
        const user = await User.findById(req.user._id).populate('joinedCalendars');

        // 🔥 Finde zusätzlich alle Kalender, bei denen der Nutzer der Besitzer ist
        const ownedCalendars = await Calendar.find({ owner: req.user._id });

        // Kombiniere beigetretene und erstellte Kalender (ohne doppelte Einträge)
        const allCalendars = [...new Set([...user.joinedCalendars, ...ownedCalendars])];

        console.log('✅ Beigetretene & eigene Kalender:', allCalendars);
        
        res.status(200).json({ success: true, calendars: allCalendars });
    } catch (error) {
        console.error('❌ Fehler bei /user-calendars:', error);
        res.status(500).json({ success: false, message: 'Fehler beim Abrufen der Kalender' });
    }
});

// routes/api.js - Endpoint um einem Kalender beizutreten
router.post('/join-calendar', ensureAuthenticated, async (req, res) => {
    const { groupCode } = req.body;

    console.log('📌 Beitrittsversuch mit Code:', groupCode);
  
    try {
        const calendar = await Calendar.findOne({ groupCode });
        if (!calendar) {
            console.log('❌ Kalender nicht gefunden');
            return res.status(404).json({ success: false, message: 'Kalender nicht gefunden' });
        }

        console.log('✅ Kalender gefunden:', calendar.groupName);

        if (!calendar.members.includes(req.user._id)) {
            console.log('📌 Nutzer tritt bei:', req.user._id);
            calendar.members.push(req.user._id);
            await calendar.save();
            
            req.user.joinedCalendars.push(calendar._id);
            await req.user.save();
        } else {
            console.log('⚠ Nutzer ist bereits Mitglied');
        }

        res.status(200).json({ success: true, message: 'Kalender erfolgreich beigetreten', calendar });
    } catch (error) {
        console.error('❌ Fehler beim Beitreten:', error);
        res.status(500).json({ success: false, message: 'Fehler beim Beitreten des Kalenders' });
    }
});

module.exports = router;
