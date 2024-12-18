import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // React Router Hook
import '../styles/Login.css'; // Wiederverwendung des existierenden CSS
import axios from 'axios';

const Groupselection = () => {
  const [groupCode, setGroupCode] = useState(''); // Zustand für den Gruppencode
  const [generatedCode, setGeneratedCode] = useState(''); // Zeige den generierten Code an
  const navigate = useNavigate(); // Initialisierung von useNavigate

  console.log('Groupselection wird geladen...'); // Debug-Output

  // Funktion zum Beitreten einer Gruppe
  const handleJoinGroup = async () => {
    if (groupCode.trim() !== '') {
      try {
        const response = await axios.post(
          'http://localhost:5000/auth/join-calendar',
          { groupCode },
          { withCredentials: true }
        );

        // Prüfen, ob calendarId vorhanden ist
        const calendarId = response.data.calendarId;
        if (calendarId) {
          alert(response.data.message);

          // Weiterleitung mit groupCode und calendarId
          navigate('/your-google-calendar', {
            state: { groupCode, calendarId },
          });
        } else {
          alert('Fehler: Keine Kalender-ID gefunden.');
        }
      } catch (error) {
        console.error('Fehler beim Beitreten der Gruppe:', error);
        alert(error.response?.data?.message || 'Fehler beim Beitreten der Gruppe.');
      }
    } else {
      alert('Bitte geben Sie einen gültigen Code ein.');
    }
  };

  // Funktion zum Erstellen einer Gruppe
  const handleCreateGroup = async () => {
    const groupName = prompt('Bitte geben Sie einen Gruppennamen ein:');
    if (!groupName || groupName.trim() === '') return;

    try {
        const response = await axios.post(
            'http://localhost:5000/auth/create-calendar',
            { groupName },
            { withCredentials: true }
        );

        if (response.data.success) {
            const { groupCode, calendarId } = response.data;
            setGeneratedCode(groupCode);
            alert(`Gruppe "${groupName}" wurde erstellt! Teilen Sie diesen Code: ${groupCode}`);

            navigate('/your-google-calendar', { state: { groupCode, calendarId } });
        } else {
            alert('Fehler beim Erstellen der Gruppe.');
        }
    } catch (error) {
        console.error('Fehler beim Erstellen der Gruppe:', error);
        alert('Fehler beim Erstellen der Gruppe.');
    }
};

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Kalendio</h1>
        <p className="login-subtitle">Wähle eine Option aus</p>

        <div className="group-buttons">
          <button
            className="login-button"
            onClick={handleCreateGroup} // Gruppe erstellen
          >
            Gruppe Erstellen
          </button>

          {/* Anzeige des generierten Codes */}
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

          <div className="join-group">
            <input
              type="text"
              placeholder="Code eingeben"
              className="login-input"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)} // Aktualisiert den Gruppencode
            />
            <button
              className="google-button"
              onClick={handleJoinGroup} // Führt die Beitrittslogik aus
            >
              Beitreten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groupselection;
