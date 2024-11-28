// src/pages/GoogleCalendarPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import GoogleLoginButton from '../components/GoogleLoginButton';
 
const GoogleCalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
 
  // Kalenderereignisse abrufen
  const fetchEvents = async () => {
    if (!accessToken) {
      alert('Bitte zuerst anmelden!');
      return;
    }
 
    try {
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setEvents(response.data.items); // Setze die abgerufenen Ereignisse
    } catch (error) {
      console.error('Fehler beim Abrufen der Ereignisse:', error);
    }
  };
 
  // Neues Ereignis hinzufügen
  const addEvent = async () => {
    if (!accessToken) {
      alert('Bitte zuerst anmelden!');
      return;
    }
 
    const event = {
      summary: 'Test Event',
      location: 'Online',
      description: 'Dies ist ein Testereignis',
      start: {
        dateTime: '2024-11-30T10:00:00Z',
        timeZone: 'Europe/Berlin',
      },
      end: {
        dateTime: '2024-11-30T12:00:00Z',
        timeZone: 'Europe/Berlin',
      },
    };
 
    try {
      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        event,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('Ereignis hinzugefügt:', response.data);
      fetchEvents(); // Aktualisiere die Liste der Ereignisse
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Ereignisses:', error);
    }
  };
 
  return (
<div>
<h1>Google Calendar Integration</h1>
      {!accessToken ? (
<GoogleLoginButton onLoginSuccess={setAccessToken} />
      ) : (
<>
<button onClick={fetchEvents}>Ereignisse abrufen</button>
<button onClick={addEvent}>Neues Ereignis hinzufügen</button>
</>
      )}
<h2>Ereignisse:</h2>
<ul>
        {events.map((event) => (
<li key={event.id}>
            {event.summary} - {event.start?.dateTime || 'Kein Datum'}
</li>
        ))}
</ul>
</div>
  );
};
 
export default GoogleCalendarPage;


