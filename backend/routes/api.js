const express = require('express');
const { google } = require('googleapis');
const Task = require('../models/Task'); // Ensure Task model is imported
require('dotenv').config();
const router = express.Router();

// Middleware to ensure user authentication
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Unauthorized' });
};

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

module.exports = router;
