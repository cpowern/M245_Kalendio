import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/DayViewWithHours.css';

const DayViewWithHours = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', date: '', time: '' });
  const [currentDate, setCurrentDate] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { calendarId, selectedDate } = location.state || {};
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const fetchDayEvents = async () => {
      if (!calendarId || !currentDate) {
        console.warn('No calendarId or currentDate provided.');
        setLoading(false);
        return;
      }

      try {
        // Events von der lokalen API (so wie in YourGoogleCalendar.jsx)
        const googleResponse = await axios.get(
          `http://localhost:5000/auth/events/${calendarId}`,
          { withCredentials: true }
        );

        const googleEvents = googleResponse.data.success
        ? googleResponse.data.events.map((event) => {
            const start = event.start.dateTime || event.start.date;
            // Wenn kein dateTime vorhanden ist, bedeutet das normalerweise "All Day".
            // Stattdessen setzen wir hier standardmäßig 12:00.
            let eventTime = '12:00';
            if (event.start.dateTime) {
              eventTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
      
            return {
              id: event.id,
              title: event.summary || 'No Title',
              start: start,
              end: event.end?.dateTime || event.end?.date,
              description: event.description || 'No description',
              isGoogleEvent: true,
              time: eventTime,
            };
          })
        : [];
      

        const taskResponse = await axios.get(
          `http://localhost:5000/tasks/debug-tasks/${calendarId}`
        );

        const dbTasks = taskResponse.data.success
          ? taskResponse.data.tasks.map((task) => {
              const start = task.date;
              return {
                id: task._id,
                title: task.title,
                start: start,
                end: start,
                description: task.description,
                isGoogleEvent: false,
                time: 'All Day', // Falls man es genauer haben möchte, könnte man Zeit hinzunehmen. 
              };
            })
          : [];

        const combinedEvents = [...googleEvents, ...dbTasks];

        // Events nach aktuellem Datum filtern
        const filteredEvents = combinedEvents.filter((event) => {
          const eventDate = new Date(event.start).toISOString().split('T')[0];
          return eventDate === currentDate;
        });

        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error fetching day events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDayEvents();
  }, [calendarId, currentDate]);

  const handlePreviousDay = () => {
    const previousDay = new Date(currentDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setCurrentDate(previousDay.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay.toISOString().split('T')[0]);
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.date || !newTask.time) {
      alert('Title, date, and time are required!');
      return;
    }

    try {
      await axios.post(
        'http://localhost:5000/tasks/create-task',
        {
          calendarId,
          title: newTask.title,
          description: newTask.description,
          date: newTask.date,
          time: newTask.time,
        },
        { withCredentials: true }
      );
      alert('Task created successfully!');
      setShowTaskForm(false);
      setNewTask({ title: '', description: '', date: '', time: '' });
      // Nach dem Erstellen neu laden, damit neue Events erscheinen
      setLoading(true);
      // Hier könnte man fetchDayEvents nochmal aufrufen oder currentDate neu setzen:
      const reFetchDate = currentDate; 
      setCurrentDate(reFetchDate); 
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    }
  };

  return (
    <div className="main-page">
      <div className="top-bar">
        <h1>Day View: {currentDate}</h1>
        <button onClick={() => navigate(-1)} className="back-button">Back to Month View</button>
      </div>

      <div className="navigation-buttons">
        <button onClick={handlePreviousDay} className="nav-button">Previous Day</button>
        <button onClick={handleNextDay} className="nav-button">Next Day</button>
      </div>

      <div className="main-content">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="calendar-container">
            <h2>Events</h2>
            <div className="day-view">
              {hours.map((hour) => (
                <div key={hour} className="hour-block">
                  <div className="hour-label">{hour}</div>
                  <div className="hour-events">
                  {events
                    .filter((event) => {
                      if (event.time === 'All Day') {
                        return hour === '0:00'; 
                      } else {
                        const eventHour = parseInt(event.time.split(':')[0], 10);
                        const currentHour = parseInt(hour.split(':')[0], 10);
                        return eventHour === currentHour;
                      }
                    })
                    .map((event) => (
                      <div key={event.id} className="event">
                        {event.title}
                      </div>
                    ))
                  }
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTaskForm(true)} className="create-task-button">
              Create Task
            </button>
          </div>
        )}
      </div>

      {showTaskForm && (
        <div className="task-popup">
          <h3>Create Task</h3>
          <label>Title:</label>
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <label>Description:</label>
          <input
            type="text"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <label>Date:</label>
          <input
            type="date"
            value={newTask.date}
            onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
          />
          <label>Time:</label>
          <input
            type="time"
            value={newTask.time}
            onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
          />
          <button onClick={handleCreateTask}>Save</button>
          <button onClick={() => setShowTaskForm(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default DayViewWithHours;
