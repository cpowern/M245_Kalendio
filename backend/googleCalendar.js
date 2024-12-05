const { google } = require('googleapis');
require('dotenv').config(); // Lade Umgebungsvariablen

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

// Setze die Zugangsdaten mit dem Refresh Token
auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth });

module.exports = calendar;
