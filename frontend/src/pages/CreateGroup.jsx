// src/pages/CreateGroup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateGroup.css'; // CSS für CreateGroup hinzufügen

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [membersCount, setMembersCount] = useState(1);
  const [ranked, setRanked] = useState(false);
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
        
        <input
          type="number"
          placeholder="Anzahl Mitglieder"
          className="create-group-input"
          value={membersCount}
          onChange={(e) => setMembersCount(e.target.value)}
        />

        {/* Rangliste Checkbox */}
        <div className="rank-toggle">
          <label htmlFor="rank-toggle-checkbox" className="rank-toggle-label">
            Rangliste anzeigen:
          </label>
          <input
            type="checkbox"
            id="rank-toggle-checkbox"
            className="rank-toggle-checkbox"
            checked={ranked}
            onChange={(e) => setRanked(e.target.checked)}
          />
        </div>

        <button className="create-group-button" onClick={handleCreateGroup}>
          Gruppe erstellen
        </button>
        
        {/* Rangliste anzeigen, falls angekreuzt */}
        {ranked && (
          <div className="rank-list">
            <h3>Rangliste:</h3>
            <ul>
              <li>Platz 1 - Max Mustermann</li>
              <li>Platz 2 - Erika Mustermann</li>
              <li>Platz 3 - John Doe</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateGroup;
