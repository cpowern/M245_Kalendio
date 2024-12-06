// src/pages/CreateGroup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateGroup.css'; // CSS für CreateGroup hinzufügen

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [membersCount, setMembersCount] = useState(1); // Initialwert 1 für Mitglieder
  const [ranked, setRanked] = useState(false); // Zustand für das Häkchen der Rangliste
  const navigate = useNavigate();

  const handleCreateGroup = () => {
    if (groupName.trim() === '') {
      alert('Bitte gib einen Gruppennamen ein.');
    } else {
      // Hier kannst du deine Logik zum Erstellen der Gruppe hinzufügen
      alert(`Gruppe "${groupName}" mit ${membersCount} Mitgliedern wurde erstellt!`);
      navigate('/mainpage'); // Navigiere zur mainpage
    }
  };

  // Funktion zur Sicherstellung, dass die Anzahl der Mitglieder immer >= 1 ist
  const handleMembersCountChange = (e) => {
    const value = Math.max(1, e.target.value); // Verhindert, dass der Wert unter 1 geht
    setMembersCount(value);
  };

  return (
    <div className="create-group-page">
      <div className="create-group-container">
        <h1 className="create-group-title">Gruppe erstellen</h1>

        <input
          type="text"
          placeholder="Gruppenname"
          className="create-group-input"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        
        {/* Label für Mitgliederanzahl */}
        <div className="members-count-container">
          <label htmlFor="members-count" className="members-count-label">
            Anzahl Mitglieder:
          </label>
          <input
            type="number"
            id="members-count"
            className="create-group-input"
            value={membersCount}
            min="1" // Verhindert das Eingeben von Werten unter 1
            onChange={handleMembersCountChange} // Verhindert das Eingeben von weniger als 1
          />
        </div>

        {/* Rangliste Checkbox */}
        <div className="rank-toggle">
          <input
            type="checkbox"
            id="rank-toggle-checkbox"
            className="rank-toggle-checkbox"
            checked={ranked}
            onChange={(e) => setRanked(e.target.checked)}
          />
          <label htmlFor="rank-toggle-checkbox" className="rank-toggle-label">
          ➡ Rangliste
          </label>
        </div>

        <button className="create-group-button" onClick={handleCreateGroup}>
          Gruppe erstellen
        </button>
      </div>
    </div>
  );
};

export default CreateGroup;
