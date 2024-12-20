import React, { useEffect, useState } from 'react';
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
  const [selectedEvent, setSelectedEvent] = useState(null); // For displaying event details in a modal
  const [showModal, setShowModal] = useState(false); // Toggle modal visibility
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
              description: event.description || 'No description',
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
              description: task.description,
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
    setSelectedEvent({
      id: event.id,
      title: event.title,
      date: event.startStr,
      description: event.extendedProps?.description || 'No description available',
    });
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/tasks/delete-task/${taskId}`);
      if (response.data.success) {
        alert('Task deleted successfully!');
        setEvents((prevEvents) => prevEvents.filter((event) => event.id !== taskId));
        setShowModal(false);
      } else {
        alert('Failed to delete task.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task.');
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.date) {
      alert('Title and date are required!');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/tasks/create-task',
        {
          calendarId,
          title: newTask.title,
          description: newTask.description,
          date: newTask.date,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert('Task created successfully!');
        setShowTaskForm(false);
        setNewTask({ title: '', description: '', date: '' });

        // Add new task to events
        setEvents((prevEvents) => [
          ...prevEvents,
          {
            id: response.data.task._id,
            title: response.data.task.title,
            start: response.data.task.date,
            end: response.data.task.date,
            description: response.data.task.description,
          },
        ]);
      } else {
        alert('Task creation failed. Please try again.');
      }
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
              <div
                style={{
                  marginTop: '20px',
                  backgroundColor: '#f9f9f9',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                }}
              >
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
                  <textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    style={{
                      width: '100%',
                      marginBottom: '10px',
                      padding: '5px',
                      minHeight: '60px',
                    }}
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

      {showModal && selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            color: 'black',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
          }}
        >
          <h3 style={{ marginBottom: '10px' }}>{selectedEvent.title}</h3>
          <p>
            <strong>Date:</strong> {new Date(selectedEvent.date).toLocaleString()}
          </p>
          <p>
            <strong>Description:</strong> {selectedEvent.description}
          </p>
          <button
            onClick={() => setShowModal(false)}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            onClick={() => handleDeleteTask(selectedEvent.id)}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#FF6347',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '10px',
            }}
          >
            Delete Task
          </button>
        </div>
      )}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
};

export default YourGoogleCalendar;
