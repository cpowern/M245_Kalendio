// YourGoogleCalendar.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '../styles/MainPage.css';

const YourGoogleCalendar = () => {
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [calendarName, setCalendarName] = useState('Your Google Calendar');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', date: '', time: '' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { groupCode, calendarId } = location.state || {};

  // NEU HINZUGEFÜGT: Pending Tasks separat verwalten
  const [pendingTasks, setPendingTasks] = useState([]);

  useEffect(() => {
    const fetchEventsAndTasks = async () => {
      if (!calendarId) {
        console.warn('No calendarId provided.');
        setLoading(false);
        return;
      }

      try {
        // Google Events
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
              isGoogleEvent: true,
              // status gibt es in Google nicht -> immer "accepted" annehmen
            }))
          : [];

        // DB Tasks
        const taskResponse = await axios.get(
          `http://localhost:5000/tasks/debug-tasks/${calendarId}`
        );

        const dbTasks = taskResponse.data.success
          ? taskResponse.data.tasks.map((task) => {
              return {
                id: task._id,
                title: task.title,
                start: task.date,
                end: task.date,
                description: task.description,
                isGoogleEvent: false,
                time: task.time || '12:00',
                status: task.status, // NEU
              };
            })
          : [];

        const combinedEvents = [...googleEvents, ...dbTasks];

        // Deduplizierung per key: (title|date)
        const eventMap = new Map();
        for (const event of combinedEvents) {
          const eventDate = new Date(event.start).toISOString().split('T')[0];
          const key = `${event.title}|${eventDate}`;
          if (!eventMap.has(key)) {
            eventMap.set(key, event);
          } else {
            const existing = eventMap.get(key);
            if (existing.isGoogleEvent && !event.isGoogleEvent) {
              eventMap.set(key, event);
            }
          }
        }

        const uniqueEvents = Array.from(eventMap.values());

        // NEU HINZUGEFÜGT: Pending-Tasks rausfiltern für separate Anzeige
        const pending = uniqueEvents.filter((ev) => ev.status === 'pending');
        const acceptedOrGoogle = uniqueEvents.filter(
          (ev) => !ev.status || ev.status === 'accepted'
        );

        setPendingTasks(pending);
        setEvents(acceptedOrGoogle);
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
      isGoogleEvent: event.extendedProps?.isGoogleEvent,
    });
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/tasks/delete-task/${taskId}`);
      if (response.data.success) {
        setEvents((prevEvents) => prevEvents.filter((event) => event.id !== taskId));
        setShowModal(false);
        alert('Task deleted successfully!');
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
          time: newTask.time.trim() === '' ? '' : newTask.time,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert('Task created successfully!');
        setShowTaskForm(false);
        setNewTask({ title: '', description: '', date: '', time: '' });

        // NEU: Da das Task anfangs "pending" ist, direkt in die pendingTasks packen
        const created = response.data.task;
        setPendingTasks((prev) => [
          ...prev,
          {
            id: created._id,
            title: created.title,
            start: created.date,
            end: created.date,
            description: created.description,
            isGoogleEvent: false,
            status: created.status,
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

  // NEU HINZUGEFÜGT: Accept & Reject
  const handleAcceptTask = async (taskId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/tasks/accept-task/${taskId}`,
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        alert(response.data.message);

        // Falls Task jetzt status='accepted' hat -> aus pendingTasks entfernen und zu events verschieben
        if (response.data.status === 'accepted') {
          setPendingTasks((prev) => prev.filter((task) => task.id !== taskId));
          // Wir könnten optional hier an `setEvents` anfügen, falls das Event
          // ab sofort in der "accepted" Liste angezeigt werden soll
          const pendingTask = pendingTasks.find((t) => t.id === taskId);
          if (pendingTask) {
            setEvents((prevEvents) => [...prevEvents, { ...pendingTask, status: 'accepted' }]);
          }
        } else {
          // oder nur Vote-Count updaten, falls wir das irgendwo anzeigen wollen
        }
      } else {
        alert(response.data.message || 'Could not accept task.');
      }
    } catch (error) {
      console.error('Error accepting task:', error);
      alert('Error accepting task.');
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/tasks/reject-task/${taskId}`,
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        alert(response.data.message);

        // Wenn Task direkt gelöscht wurde -> komplett rausfiltern
        if (response.data.message === 'Task rejected and deleted') {
          setPendingTasks((prev) => prev.filter((task) => task.id !== taskId));
        }
      } else {
        alert(response.data.message || 'Could not reject task.');
      }
    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('Error rejecting task.');
    }
  };

  return (
    <div className="main-page-container">
      <header className="main-page-header">
        <h1>{calendarName}</h1>
        {groupCode && (
          <div className="group-code-display" style={{ position: 'absolute', top: 20, right: 20 }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              Group Code: <strong>{groupCode}</strong>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(groupCode);
                  alert('Group Code copied to clipboard!');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Copy Group Code"
              >
                📋
              </button>
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
            
            <button
              onClick={() =>
                navigate('/day-view', {
                  state: {
                    calendarId: calendarId,
                    selectedDate: new Date().toISOString().split('T')[0],
                  },
                })
              }
              style={{
                marginTop: '20px',
                marginLeft: '10px',
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              To the Day View
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
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
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
                <div>
                  <label>Time (optional):</label>
                  <input
                    type="time"
                    value={newTask.time}
                    onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                    placeholder="Optional, default 12:00"
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

      {/* NEU HINZUGEFÜGT: Bereich für Pending Tasks */}
      {!loading && pendingTasks.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            backgroundColor: '#fff8cd',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            // NEU: Schrift schwarz machen
            color: 'black',
          }}
        >
          <h2>Pending Tasks</h2>
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              style={{
                border: '1px solid #ccc',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '5px',
              }}
            >
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <p>
                <strong>Date:</strong>{' '}
                {new Date(task.start).toLocaleDateString()}{' '}
                {new Date(task.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <button
                onClick={() => handleAcceptTask(task.id)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: 'green',
                  color: 'white',
                  border: 'none',
                  marginRight: '10px',
                  cursor: 'pointer',
                }}
              >
                Accept
              </button>
              <button
                onClick={() => handleRejectTask(task.id)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reject
              </button>
            </div>
          ))}
        </div>
      )}

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
            <strong>Date:</strong>{' '}
            {new Date(selectedEvent.date).toLocaleString()}
          </p>
          <p>
            <strong>Description:</strong> {selectedEvent.description}
          </p>
          {!selectedEvent.isGoogleEvent && (
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
          )}
          <button
            onClick={() => setShowModal(false)}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '10px',
            }}
          >
            Close
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
