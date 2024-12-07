const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  '477667469500-oqgtqmei8fhtu7ephkt3uemfr5dn1vfc.apps.googleusercontent.com',
  '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'
);

oauth2Client.setCredentials({
  refresh_token: '1//04bHlCQCNZW3MCgYIARAAGAQSNwF-L9IrWH5sRqnccUNRalU8aUJdbhGOReKS-s8x2FaEI16T2Q65sDNchywVtiZcMM9XGbKR2Fs',
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

async function listEvents() {
  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    console.log('Events:', res.data.items);
  } catch (err) {
    console.error('Error connecting to Calendar API:', err);
  }
}

listEvents();
