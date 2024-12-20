import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '../styles/MainPage.css';

const YourGoogleCalendar = () => {
  const [events, setEvents] = useState([]); // State for events
  const [loading, setLoading] = useState(true); // Loading state
  const calendarId = 'YOUR_CALENDAR_ID'; // Replace with the actual calendarId
  const navigate = useNavigate(); // For navigation to DailySchedule

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/auth/events/${calendarId}`, {
          withCredentials: true,
        });

        if (response.data.success) {
          setEvents(response.data.events); // Set the events
        } else {
          console.error('Failed to fetch events:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [calendarId]);

  // Handle date clicks
  const handleDateClick = (info) => {
    navigate('/daily-schedule', { state: { selectedDate: info.dateStr, calendarId } });
  };

  if (loading) {
    return <p style={{ textAlign: 'center' }}>Lädt...</p>;
  }

  return (
    <div className="main-page-container">
      <header className="main-page-header">
        <h1>Your Google Calendar</h1>
      </header>

      <div className="calendar-container" style={{ marginTop: '20px' }}>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events} // Pass events here
          dateClick={handleDateClick} // Handle date clicks
        />
      </div>
    </div>
  );
};

export default YourGoogleCalendar;
