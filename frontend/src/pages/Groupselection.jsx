import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Login.css';

// Popup-Komponente
const Popup = ({ message, onClose }) => {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <button onClick={onClose} className="popup-close-button">Schließen</button>
      </div>
    </div>
  );
};

const GroupSelection = () => {
  const [groupCode, setGroupCode] = useState('');   // Zustand für den Eingabe-Code
  const [generatedCode, setGeneratedCode] = useState(''); // Generierter Code nach Erstellung
  const [popupMessage, setPopupMessage] = useState('');   // Meldungen (Erfolg/Fehler) im Popup
  const [loading, setLoading] = useState(false);          // Loading-Overlay
  const [calendars, setCalendars] = useState([]);         // Bereits vorhandene Kalender des Nutzers

  const navigate = useNavigate();

  // Beim Laden der Komponente alle Kalender laden
  useEffect(() => {
    axios
      .get('http://localhost:5000/api/user-calendars', { withCredentials: true })
      .then((response) => {
        setCalendars(response.data.calendars || []);
      })
      .catch((error) => {
        console.error('Fehler beim Laden der Kalender:', error);
      });
  }, []);

  // Funktion zum Beitreten einer Gruppe
  const handleJoinGroup = async () => {
    if (groupCode.trim() === '') {
      setPopupMessage('Bitte geben Sie einen gültigen Code ein.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/join-calendar',
        { groupCode },
        { withCredentials: true }
      );

      if (response.data.success) {
        setPopupMessage(response.data.message);
        // Neuen Kalender auch in der lokalen Liste aktualisieren
        setCalendars([...calendars, response.data.calendar]);

        // Weiterleitung zur Kalender-Ansicht
        navigate('/your-google-calendar', {
          state: {
            groupCode,
            calendarId: response.data.calendar.calendarId,
          },
        });
      } else {
        setPopupMessage('Fehler: Keine Kalender-ID gefunden.');
      }
    } catch (error) {
      console.error('Fehler beim Beitreten der Gruppe:', error);
      setPopupMessage(
        error.response?.data?.message || 'Fehler beim Beitreten der Gruppe.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Funktion zum Erstellen einer Gruppe
  const handleCreateGroup = async () => {
    const groupName = prompt('Bitte geben Sie einen Gruppennamen ein:');
    if (!groupName || groupName.trim() === '') return;

    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/auth/create-calendar',
        { groupName },
        { withCredentials: true }
      );

      if (response.data.success) {
        const { groupCode, calendarId, calendar } = response.data;
        setGeneratedCode(groupCode);

        // Kalenderliste updaten, damit der Nutzer direkt sieht, dass jetzt ein neuer Kalender existiert
        setCalendars([...calendars, calendar]);

        // Popup-Meldung
        setPopupMessage(`Gruppe "${groupName}" wurde erstellt! Teilen Sie diesen Code: ${groupCode}`);

        // Weiterleitung zur Kalender-Ansicht
        navigate('/your-google-calendar', {
          state: { groupCode, calendarId },
        });
      } else {
        setPopupMessage('Fehler beim Erstellen der Gruppe.');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Gruppe:', error);
      setPopupMessage('Fehler beim Erstellen der Gruppe.');
    } finally {
      setLoading(false);
    }
  };

  // Schließt das Popup
  const closePopup = () => {
    setPopupMessage('');
  };

  return (
    <div className="login-page">
      {/* Lade-Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Wird geladen...</p>
        </div>
      )}

      {/* Popup bei vorhandener Nachricht */}
      {popupMessage && <Popup message={popupMessage} onClose={closePopup} />}

      <div className="login-container">
        <h1 className="login-title">Kalendio</h1>
        <p className="login-subtitle">Wähle eine Option aus</p>

        <div className="group-buttons">
          {/* Gruppe erstellen */}
          <button className="login-button" onClick={handleCreateGroup}>
            Gruppe Erstellen
          </button>

          {/* Falls ein Code generiert wurde, zeigen wir ihn an */}
          {generatedCode && (
            <div className="group-code-display">
              <p>Teile diesen Code, um der Gruppe beizutreten:</p>
              <h2>{generatedCode}</h2>
            </div>
          )}

          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">or</span>
            <span className="divider-line"></span>
          </div>

          {/* Gruppe beitreten */}
          <div className="join-group">
            <input
              type="text"
              placeholder="Code eingeben"
              className="login-input"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
            />
            <button className="google-button" onClick={handleJoinGroup}>
              Beitreten
            </button>
          </div>
        </div>

        {/* Liste der Kalender/ Gruppen, in denen der Nutzer bereits ist */}
        <h2>Deine Kalender</h2>
        {calendars.length > 0 ? (
          <ul className="calendar-list">
            {calendars.map((calendar) => (
              <li
                key={calendar._id}
                className="calendar-item"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() =>
                  navigate('/your-google-calendar', {
                    state: {
                      calendarId: calendar.calendarId,
                      groupCode: calendar.groupCode,
                    },
                  })
                }
              >
                {calendar.groupName}
              </li>
            ))}
          </ul>
        ) : (
          <p>Du bist noch keinem Kalender beigetreten.</p>
        )}
      </div>
    </div>
  );
};

export default GroupSelection;
