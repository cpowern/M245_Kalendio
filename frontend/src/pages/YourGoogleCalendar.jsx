// YourGoogleCalendar.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '../styles/MainPage.css';

const YourGoogleCalendar = () => {
  // -------------------- STATES (Termine, Tasks, etc.) --------------------
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarName, setCalendarName] = useState('Your Google Calendar');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', date: '', time: '' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // -------------------- Pending Tasks --------------------
  const [pendingTasks, setPendingTasks] = useState([]);

  // -------------------- NOTIZEN: UI States --------------------
  const [showNotesModal, setShowNotesModal] = useState(false);

  // "notesStructure": bereits aufgebaute Baumstruktur für das UI
  const [notesStructure, setNotesStructure] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);

  // Popups zum Erstellen von Ordner/Notiz
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
  const [showNewNotePopup, setShowNewNotePopup] = useState(false);

  // Eingabe-Felder im Popup
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteName, setNewNoteName] = useState('');

  // Router location/state
  const location = useLocation();
  const navigate = useNavigate();
  const { groupCode, calendarId } = location.state || {};

  // ----------------------------------------------------------
  // 1) EVENTS & TASKS
  // ----------------------------------------------------------
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
          ? googleResponse.data.events.map((ev) => ({
              id: ev.id,
              title: ev.summary || 'No Title',
              start: ev.start.dateTime || ev.start.date,
              end: ev.end?.dateTime || ev.end?.date,
              description: ev.description || 'No description',
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
        for (const e of combinedEvents) {
          const eventDate = new Date(e.start).toISOString().split('T')[0];
          const key = `${e.title}|${eventDate}`;
          if (!eventMap.has(key)) {
            eventMap.set(key, e);
          } else {
            const existing = eventMap.get(key);
            // Falls existing isGoogleEvent -> wir nehmen den DB-Task
            if (existing.isGoogleEvent && !e.isGoogleEvent) {
              eventMap.set(key, e);
            }
          }
        }
        const uniqueEvents = Array.from(eventMap.values());

        // Pending vs. accepted
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

  // ----------------------------------------------------------
  // 2) CALENDAR DETAILS
  // ----------------------------------------------------------
  useEffect(() => {
    const fetchCalendarDetails = async () => {
      if (!calendarId) return;
      try {
        const response = await axios.get('http://localhost:5000/auth/list-calendars', {
          withCredentials: true,
        });
        if (response.data.success) {
          const foundCal = response.data.calendars.find((c) => c.id === calendarId);
          if (foundCal) {
            setCalendarName(foundCal.summary);
          }
        }
      } catch (error) {
        console.error('Error fetching calendar name:', error);
      }
    };
    fetchCalendarDetails();
  }, [calendarId]);

  // ----------------------------------------------------------
  // 3) EVENT-KLICK
  // ----------------------------------------------------------
  const handleEventClick = (info) => {
    const ev = info.event;
    setSelectedEvent({
      id: ev.id,
      title: ev.title,
      date: ev.startStr,
      description: ev.extendedProps?.description || 'No description available',
      isGoogleEvent: ev.extendedProps?.isGoogleEvent,
    });
    setShowModal(true);
  };

  // ----------------------------------------------------------
  // 4) TASKS: Delete, Create, Accept, Reject
  // ----------------------------------------------------------
  const handleDeleteTask = async (taskId) => {
    try {
      const resp = await axios.delete(`http://localhost:5000/tasks/delete-task/${taskId}`, {
        withCredentials: true,
      });
      if (resp.data.success) {
        // remove from events
        setEvents((prev) => prev.filter((e) => e.id !== taskId));
        setShowModal(false);
        alert('Task deleted successfully!');
      } else {
        alert('Failed to delete task.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('No authority to delete this task');
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.date) {
      alert('Title and date are required!');
      return;
    }
    try {
      const resp = await axios.post(
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
      if (resp.data.success) {
        alert('Task created successfully!');
        setShowTaskForm(false);
        setNewTask({ title: '', description: '', date: '', time: '' });
        // Neuer Task → pending
        const created = resp.data.task;
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

  const handleAcceptTask = async (taskId) => {
    try {
      const resp = await axios.post(
        `http://localhost:5000/tasks/accept-task/${taskId}`,
        {},
        { withCredentials: true }
      );
      if (resp.data.success) {
        alert(resp.data.message);
        if (resp.data.status === 'accepted') {
          setPendingTasks((prev) => prev.filter((t) => t.id !== taskId));
          // Move from pending to accepted
          const found = pendingTasks.find((t) => t.id === taskId);
          if (found) {
            setEvents((prevEvents) => [...prevEvents, { ...found, status: 'accepted' }]);
          }
        }
      } else {
        alert(resp.data.message || 'Could not accept task.');
      }
    } catch (error) {
      console.error('Error accepting task:', error);
      alert('Error accepting task.');
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      const resp = await axios.post(
        `http://localhost:5000/tasks/reject-task/${taskId}`,
        {},
        { withCredentials: true }
      );
      if (resp.data.success) {
        alert(resp.data.message);
        if (resp.data.message === 'Task rejected and deleted') {
          setPendingTasks((prev) => prev.filter((t) => t.id !== taskId));
        }
      } else {
        alert(resp.data.message || 'Could not reject task.');
      }
    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('Error rejecting task.');
    }
  };

  // ----------------------------------------------------------
  // 5) NOTIZEN-FUNKTIONEN (Variante A: Einzeldokument pro Note)
  // ----------------------------------------------------------

  // a) buildTree: Baut die verschachtelte Struktur (Ordner/Notizen) aus flacher Liste
  function buildTree(allNotes, parentId = null) {
    return allNotes
      .filter((note) => {
        const p = note.parent ? note.parent._id || note.parent : null; 
        return parentId === null ? p === null : p === parentId;
      })
      .map((note) => {
        // Kinder suchen
        const children = buildTree(allNotes, note._id);
        return {
          id: note._id,
          name: note.title,
          type: note.isFolder ? 'folder' : 'note',
          children,
        };
      });
  }

// Ruft /notes/all/:calendarId auf
const reloadAllNotes = async () => {
  if (!calendarId) return;
  try {
    const resp = await axios.get(
      `http://localhost:5000/notes/all/${calendarId}`,
      { withCredentials: true }
    );
    if (resp.data.success) {
      const allNotes = resp.data.notes; 
      const tree = buildTree(allNotes, null);
      setNotesStructure(tree);
    }
  } catch (err) {
    console.error('Fehler beim Laden der Notizen:', err);
  }
};


  // c) Wenn Notizen-Modal geöffnet → alle Notizen laden
  useEffect(() => {
    if (showNotesModal) {
      reloadAllNotes();
    }
  }, [showNotesModal]);

  const addFolder = async () => {
    if (!newFolderName.trim()) return;
    const parentObj = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
    const parentId = parentObj ? parentObj.id : null;
  
    try {
      const resp = await axios.post(
        'http://localhost:5000/notes',
        {
          calendarId,    // <- ist ein String, zB "xyz@group.calendar.google.com"
          title: newFolderName,
          content: '',
          isFolder: true,
          parent: parentId, // kann null sein
        },
        { withCredentials: true }
      );
      if (resp.data.success) {
        // neu laden
        reloadAllNotes();
      }
    } catch (err) {
      console.error('Fehler beim Erstellen des Ordners:', err);
    }
    setNewFolderName('');
    setShowNewFolderPopup(false);
  };  

  const addNote = async () => {
    if (!newNoteName.trim()) return;
    const parentObj = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
    const parentId = parentObj ? parentObj.id : null;

    try {
      const resp = await axios.post(
        'http://localhost:5000/notes',
        {
          calendarId,
          title: newNoteName,
          content: '', // Optionally we can add content or a separate input
          isFolder: false,
          parent: parentId,
        },
        { withCredentials: true }
      );
      if (resp.data.success) {
        // Neu laden
        await reloadAllNotes();
      }
    } catch (err) {
      console.error('Fehler beim Erstellen der Notiz:', err);
    }
    setNewNoteName('');
    setShowNewNotePopup(false);
  };

  // e) In Ordner navigieren
  const navigateToFolder = (folder) => {
    setCurrentPath([...currentPath, folder]);
  };

  // f) Zurück
  const goBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
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
                backgroundColor: '#FFA500', 
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

      {/* NOTIZEN-POPUP */}
      {showNotesModal && (
        <>
          {/* Overlay */}
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
              color: 'black',
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

            {/* Buttons: Ordner+ / Notiz+ */}
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

            {/* Pfad-Anzeige */}
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

            {/* Ordner / Notizen-Liste (bereits als Tree in notesStructure) */}
            <ul style={{ flex: '1', margin: 0, padding: 0, listStyle: 'none' }}>
              {(
                currentPath.length === 0
                  ? notesStructure // Root
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

            {/* Schliessen-Button */}
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

      {/* POP-UP: NEUER ORDNER */}
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
              color: 'black',
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

      {/* POP-UP: NEUE NOTIZ */}
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
              color: 'black',
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
