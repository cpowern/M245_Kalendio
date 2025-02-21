// YourGoogleCalendar.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '../styles/MainPage.css';

const YourGoogleCalendar = () => {
  // -------------------- Vorhandene States --------------------
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [calendarName, setCalendarName] = useState('Your Google Calendar');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', date: '', time: '' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // -------------------- Pending Tasks --------------------
  const [pendingTasks, setPendingTasks] = useState([]);

  // -------------------- Notizen-Pop-up States --------------------
  const [showNotesModal, setShowNotesModal] = useState(false);  
  const [notesStructure, setNotesStructure] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  
  // Zwei kleine Pop-ups fürs Erstellen
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
  const [showNewNotePopup, setShowNewNotePopup] = useState(false);

  // Eingabefelder in den kleinen Pop-ups
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteName, setNewNoteName] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const { groupCode, calendarId } = location.state || {};

  // -------------------- useEffect: Events & Tasks --------------------
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
            }))
          : [];

        // DB Tasks
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
              isGoogleEvent: false,
              time: task.time || '12:00',
              status: task.status,
            }))
          : [];

        // Kombinieren & Deduplizieren
        const combinedEvents = [...googleEvents, ...dbTasks];
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

        // Pending & Accepted
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

  // -------------------- useEffect: Calendar Details --------------------
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

  // -------------------- Klick auf Event --------------------
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

  // -------------------- Task löschen --------------------
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/tasks/delete-task/${taskId}`,
        { withCredentials: true }
      );
      if (response.data.success) {
        setEvents((prev) => prev.filter((event) => event.id !== taskId));
        setShowModal(false);
        alert('Task deleted successfully!');
      } else {
        alert('Failed to delete task.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('You dont have the authority to delete this task');
    }
  };

  // -------------------- Task erstellen --------------------
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

        // Pending-Task direkt in pendingTasks
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

  // -------------------- Task akzeptieren/rejecten --------------------
  const handleAcceptTask = async (taskId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/tasks/accept-task/${taskId}`,
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        alert(response.data.message);
        if (response.data.status === 'accepted') {
          // Aus pending raus, in events verschieben
          setPendingTasks((prev) => prev.filter((task) => task.id !== taskId));
          const pendingTask = pendingTasks.find((t) => t.id === taskId);
          if (pendingTask) {
            setEvents((prevEvents) => [...prevEvents, { ...pendingTask, status: 'accepted' }]);
          }
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

  // ==================== NOTIZEN-FUNKTIONEN (NEU) =====================
  const navigateToFolder = (folder) => {
    setCurrentPath([...currentPath, folder]);
  };

  const goBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    const updatedStructure = [...notesStructure];
    let target = updatedStructure;

    currentPath.forEach(folder => {
      target = target.find(item => item.id === folder.id)?.children || [];
    });

    target.push({
      id: Date.now(),
      name: newFolderName,
      type: 'folder',
      children: [],
    });

    setNotesStructure(updatedStructure);
    setNewFolderName('');
    setShowNewFolderPopup(false);
  };

  const addNote = () => {
    if (!newNoteName.trim()) return;
    const updatedStructure = [...notesStructure];
    let target = updatedStructure;

    currentPath.forEach(folder => {
      target = target.find(item => item.id === folder.id)?.children || [];
    });

    target.push({
      id: Date.now(),
      name: newNoteName,
      type: 'note',
    });

    setNotesStructure(updatedStructure);
    setNewNoteName('');
    setShowNewNotePopup(false);
  };

  return (
    <div className="main-page-container">
      {/* HEADER */}
      <header className="main-page-header">
        <h1>{calendarName}</h1>
        {groupCode && (
          <div
            className="group-code-display"
            style={{ position: 'absolute', top: 20, right: 20 }}
          >
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

      {/* FULLCALENDAR + BUTTONS */}
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

            {/* CREATE TASK BUTTON */}
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

            {/* DAY VIEW BUTTON */}
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

            {/* NOTIZEN-BUTTON */}
            <button
              onClick={() => setShowNotesModal(true)}
              style={{
                marginTop: '20px',
                marginLeft: '10px',
                padding: '10px 20px',
                backgroundColor: '#FFA500', // Orange
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Notizen
            </button>

            {/* CREATE TASK FORM */}
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

      {/* PENDING TASKS */}
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

      {/* EVENT-DETAILS-MODAL */}
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

      {/* NOTIZEN-POPUP (grosses Fenster) */}
      {showNotesModal && (
        <>
          {/* Overlay zum Schliessen */}
          <div
            onClick={() => setShowNotesModal(false)}
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
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              color: 'black',              // <-- Hier schwarzer Text
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              zIndex: 1000,
              width: '700px',
              height: '600px',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
            }}
          >
            <h2 style={{ marginBottom: '10px', color: 'black' }}>Notizen & Ordner</h2>

            {/* Erstellen-Buttons oben rechts */}
            <div style={{ position: 'absolute', top: '20px', right: '30px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowNewFolderPopup(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'green',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Ordner +
              </button>
              <button
                onClick={() => setShowNewNotePopup(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'blue',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Notiz +
              </button>
            </div>

            {/* Aktueller Pfad */}
            <p>
              <strong>Pfad:</strong>{' '}
              {currentPath.length > 0
                ? currentPath.map(folder => folder.name).join(' > ')
                : 'Hauptverzeichnis'}
            </p>

            {/* Zurück-Button */}
            {currentPath.length > 0 && (
              <button
                onClick={goBack}
                style={{
                  padding: '5px 10px',
                  backgroundColor: 'gray',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '10px',
                }}
              >
                ⬅️ Zurück
              </button>
            )}

            {/* Ordner / Notizen-Liste */}
            <ul style={{ flex: '1', margin: 0, padding: 0, listStyle: 'none' }}>
              {(currentPath.length === 0
                ? notesStructure
                : currentPath[currentPath.length - 1].children
              ).map(item => (
                <li key={item.id} style={{ cursor: 'pointer', padding: '5px 0' }}>
                  {item.type === 'folder' ? (
                    <span
                      onClick={() => navigateToFolder(item)}
                      style={{ fontWeight: 'bold', color: 'blue' }}
                    >
                      📁 {item.name}
                    </span>
                  ) : (
                    <span>📝 {item.name}</span>
                  )}
                </li>
              ))}
            </ul>

            {/* Schliessen-Button unten in der Mitte */}
            <button
              onClick={() => setShowNotesModal(false)}
              style={{
                alignSelf: 'center',
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Schliessen
            </button>
          </div>
        </>
      )}

      {/* POP-UP FÜR NEUEN ORDNER */}
      {showNewFolderPopup && (
        <>
          <div
            onClick={() => setShowNewFolderPopup(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              color: 'black', // <-- schwarzer Text
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              padding: '20px',
              zIndex: 10000,
              width: '300px',
            }}
          >
            <h3 style={{ marginBottom: '10px', color: 'black' }}>Neuen Ordner erstellen</h3>
            <input
              type="text"
              placeholder="Ordnername"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              style={{
                width: '100%',
                marginBottom: '10px',
                padding: '5px',
                color: 'black',
                borderColor: '#ccc',
                backgroundColor: 'white',
              }}
            />
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setShowNewFolderPopup(false)}
                style={{
                  marginRight: '10px',
                  padding: '6px 12px',
                  backgroundColor: 'gray',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={addFolder}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'green',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Erstellen
              </button>
            </div>
          </div>
        </>
      )}

      {/* POP-UP FÜR NEUE NOTIZ */}
      {showNewNotePopup && (
        <>
          <div
            onClick={() => setShowNewNotePopup(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              color: 'black', // <-- schwarzer Text
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              padding: '20px',
              zIndex: 10000,
              width: '300px',
            }}
          >
            <h3 style={{ marginBottom: '10px', color: 'black' }}>Neue Notiz erstellen</h3>
            <input
              type="text"
              placeholder="Notizname"
              value={newNoteName}
              onChange={(e) => setNewNoteName(e.target.value)}
              style={{
                width: '100%',
                marginBottom: '10px',
                padding: '5px',
                color: 'black',
                borderColor: '#ccc',
                backgroundColor: 'white',
              }}
            />
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setShowNewNotePopup(false)}
                style={{
                  marginRight: '10px',
                  padding: '6px 12px',
                  backgroundColor: 'gray',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={addNote}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'blue',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Erstellen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default YourGoogleCalendar;
