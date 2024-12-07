// src/pages/Groupselection.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // React Router Hook
import '../styles/Login.css'; // Wiederverwendung des existierenden CSS
import axios from 'axios';

const Groupselection = () => {
  const [groupCode, setGroupCode] = useState(''); // Zustand für den Gruppencode
  const navigate = useNavigate(); // Initialisierung von useNavigate

  const handleJoinGroup = async () => {
    if (groupCode.trim() !== '') {
      try {
        const response = await axios.post('http://localhost:5000/groups/join', {
          groupCode,
          userEmail: 'USER_EMAIL', // Hier könnte der Nutzer-Email-Input verwendet werden
        });
        alert('Erfolgreich der Gruppe beigetreten!');
        navigate('/mainpage');
      } catch (error) {
        console.error('Fehler beim Beitreten der Gruppe:', error);
        alert('Fehler beim Beitreten der Gruppe.');
      }
    } else {
      alert('Bitte geben Sie einen gültigen Code ein.');
    }
  };

  const handleCreateGroup = () => {
    // Weiterleiten zur Seite, auf der eine neue Gruppe erstellt wird
    navigate('/creategroup');
  };
  

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Kalendio</h1>
        <p className="login-subtitle">Wähle eine Option aus</p>
        <div className="group-buttons">
          <button
            className="login-button"
            onClick={handleCreateGroup} // Weiterleiten zur Gruppe-Erstellen-Seite
          >
            Gruppe Erstellen
          </button>
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
