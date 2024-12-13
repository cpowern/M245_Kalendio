import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const GoogleCalendarPage = () => {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);
  const [events, setEvents] = useState([]);

  // Fetch all calendars on component mount
  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/list-calendars', {
          withCredentials: true, // Ensures cookies/session are sent
        });
        if (response.data.success) {
          setCalendars(response.data.calendars);
        } else {
          console.error('Failed to fetch calendars:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching calendars:', error);
      }
    };

    fetchCalendars();
  }, []);

  // Fetch events for a specific calendar
  const fetchEvents = async (calendarId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/events/${calendarId}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        // Format events for FullCalendar
        const formattedEvents = response.data.events.map((event) => ({
          title: event.summary,
          start: event.start.dateTime || event.start.date,
          end: event.end?.dateTime || event.end?.date,
        }));
        setEvents(formattedEvents);
      } else {
        console.error('Failed to fetch events:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Handle calendar selection
  const handleCalendarSelect = (calendarId) => {
    setSelectedCalendarId(calendarId);
    fetchEvents(calendarId); // Fetch events for the selected calendar
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Google Calendar Integration</h1>
      <h2>Your Calendars</h2>
      <ul>
        {calendars.length > 0 ? (
          calendars.map((calendar) => (
            <li key={calendar.id} style={{ marginBottom: '10px', cursor: 'pointer' }}>
              <button onClick={() => handleCalendarSelect(calendar.id)}>
                {calendar.summary} ({calendar.timeZone || 'No Timezone'})
              </button>
            </li>
          ))
        ) : (
          <p>No calendars found.</p>
        )}
      </ul>

      {selectedCalendarId && (
        <div style={{ marginTop: '20px' }}>
          <h3>Events for Calendar: {selectedCalendarId}</h3>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events} // Display fetched events
          />
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarPage;
