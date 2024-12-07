//googlecalendar.js
const { google } = require('googleapis');

// Google OAuth-Client mit Refresh Token
const getAuthClient = () => {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    return auth;
};

// Kalender erstellen
const createCalendar = async (groupName) => {
    const auth = getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const response = await calendar.calendars.insert({
            requestBody: {
                summary: groupName,
                timeZone: 'Europe/Berlin',
            },
        });
        return response.data.id;
    } catch (error) {
        throw new Error(error.message || 'Fehler beim Erstellen des Kalenders');
    }
};

// Rechte für Kalender setzen
const shareCalendar = async (calendarId, userEmail) => {
    const auth = getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    try {
        await calendar.acl.insert({
            calendarId,
            requestBody: {
                role: 'writer',
                scope: {
                    type: 'user',
                    value: userEmail,
                },
            },
        });
    } catch (error) {
        throw new Error(error.message || 'Fehler beim Teilen des Kalenders');
    }
};

module.exports = { createCalendar, shareCalendar };
