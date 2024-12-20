import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '../styles/MainPage.css';

const YourGoogleCalendar = () => {
  const [events, setEvents] = useState([]); // Unified events list
  const [loading, setLoading] = useState(true);
  const [calendarName, setCalendarName] = useState('Your Google Calendar'); // Default name
  const [showTaskForm, setShowTaskForm] = useState(false); // To toggle task creation form
  const [newTask, setNewTask] = useState({ title: '', description: '', date: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const { groupCode, calendarId } = location.state || {};

  useEffect(() => {
    const fetchEventsAndTasks = async () => {
      if (!calendarId) {
        console.warn('No calendarId provided.');
        setLoading(false);
        return;
      }

      try {
        const googleResponse = await axios.get(
          `http://localhost:5000/auth/events/${calendarId}`,
          { withCredentials: true }
        );

        const googleEvents = googleResponse.data.success
          ? googleResponse.data.events.map((event) => ({
              id: event.id,
              title: event.summary || 'No Title',
              start: event.start.dateTime || event.start.date,
              end: event.end?.dateTime || event.end?.date,
            }))
          : [];

        const taskResponse = await axios.get(
          `http://localhost:5000/tasks/debug-tasks/${calendarId}`
        );

        const dbTasks = taskResponse.data.success
          ? taskResponse.data.tasks.map((task) => ({
              id: task._id,
              title: task.title,
              start: task.date,
              end: task.date,
            }))
          : [];

        setEvents([...googleEvents, ...dbTasks]);
      } catch (error) {
        console.error('Error fetching events and tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsAndTasks();
  }, [calendarId]);

  useEffect(() => {
    const fetchCalendarDetails = async () => {
      if (!calendarId) {
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/auth/list-calendars`, {
          withCredentials: true,
        });

        if (response.data.success) {
          const calendar = response.data.calendars.find((cal) => cal.id === calendarId);
          if (calendar) {
            setCalendarName(calendar.summary);
          }
        }
      } catch (error) {
        console.error('Error fetching calendar name:', error);
      }
    };

    fetchCalendarDetails();
  }, [calendarId]);

  const handleEventClick = (info) => {
    const event = info.event;
    const formattedDate = new Date(event.startStr).toISOString().split('T')[0];
    navigate('/Show-Task', {
      state: {
        calendarId,
        selectedDate: formattedDate,
        eventId: event.id,
      },
    });
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.date) {
      alert('Title and date are required!');
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
        },
        { withCredentials: true }
      );
      alert('Task created successfully!');
      setShowTaskForm(false);
      setNewTask({ title: '', description: '', date: '' });
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    }
  };

  return (
    <div className="main-page-container">
      <header className="main-page-header">
        <h1>{calendarName}</h1>
        {groupCode && (
          <div className="group-code-display" style={{ position: 'absolute', top: 20, right: 20 }}>
            <p>
              Group Code: <strong>{groupCode}</strong>
            </p>
          </div>
        )}
      </header>

      <div className="calendar-container" style={{ marginTop: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading...</p>
        ) : (
          <>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventClick={handleEventClick}
            />
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {showTaskForm ? 'Cancel' : 'Create Task'}
            </button>
            {showTaskForm && (
              <div style={{ marginTop: '20px' }}>
                <h3>Create a New Task</h3>
                <div>
                  <label>Title:</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    required
                    style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                  />
                </div>
                <div>
                  <label>Description:</label>
                  <input
                    type="text"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                  />
                </div>
                <div>
                  <label>Date:</label>
                  <input
                    type="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                    required
                    style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                  />
                </div>
                <button
                  onClick={handleCreateTask}
                  style={{
                    marginTop: '10px',
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save Task
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default YourGoogleCalendar;
