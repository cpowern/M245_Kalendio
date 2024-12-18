import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '../styles/MainPage.css';

const YourGoogleCalendar = () => {
  const [events, setEvents] = useState([]); // Zustand für Events
  const [loading, setLoading] = useState(true); // Ladezustand
  const location = useLocation();
  const { groupCode, calendarId } = location.state || {}; // Extract passed data

  console.log('Received Group Code:', groupCode);
  console.log('Received Calendar ID:', calendarId);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!calendarId) {
        console.warn('No calendarId provided.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/auth/events/${calendarId}`, {
          withCredentials: true,
        });

        if (response.data.success) {
          console.log('Geladene Events:', response.data.events);
          const formattedEvents = response.data.events.map((event) => ({
            title: event.summary || 'Kein Titel',
            start: event.start.dateTime || event.start.date,
            end: event.end?.dateTime || event.end?.date,
          }));
          setEvents(formattedEvents);
        } else {
          console.error('Failed to fetch events:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false); // Ladezustand beenden
      }
    };

    fetchEvents();
  }, [calendarId]);

  if (!calendarId) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Fehler: Kalender-ID fehlt!</div>;
  }

  return (
    <div className="main-page-container">
      <header className="main-page-header">
        <h1>Your Google Calendar</h1>
        {groupCode && (
          <div className="group-code-display" style={{ position: 'absolute', top: 20, right: 20 }}>
            <p>Group Code: <strong>{groupCode}</strong></p>
          </div>
        )}
      </header>

      <div className="calendar-container" style={{ marginTop: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center' }}>Lädt...</p>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events} // Events anzeigen
          />
        )}
      </div>
    </div>
  );
};

export default YourGoogleCalendar;
