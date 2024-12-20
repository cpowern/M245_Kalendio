import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/CreateGroup.css'; // CSS für CreateGroup hinzufügen

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [membersCount, setMembersCount] = useState(1); // Initialwert 1 für Mitglieder
  const [ranked, setRanked] = useState(false); // Zustand für das Häkchen der Rangliste
  const [generatedCode, setGeneratedCode] = useState(''); // Zeige den generierten Code an
  const navigate = useNavigate();

  const handleCreateGroup = async () => {
    if (groupName.trim() === '') {
      alert('Bitte gib einen Gruppennamen ein.');
      return;
    }

    try {
      // POST-Request an die Backend-Route senden
      const response = await axios.post(
        'http://localhost:5000/auth/create-calendar',
        { groupName },
        { withCredentials: true } // Wichtig für Sessions/Cookies
      );

      if (response.data.success) {
        setGeneratedCode(response.data.groupCode); // Speichere den Code
        alert(`Gruppe "${groupName}" wurde erstellt! Teilen Sie diesen Code: ${response.data.groupCode}`);
        console.log('Group Name:', groupName);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Gruppe:', error);
      alert('Fehler beim Erstellen der Gruppe');
    }
  };

  // Sicherstellen, dass Mitgliederanzahl >= 1 bleibt
  const handleMembersCountChange = (e) => {
    const value = Math.max(1, e.target.value);
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
            min="1"
            onChange={handleMembersCountChange}
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

        {/* Zeige den generierten Code an */}
        {generatedCode && (
          <div className="group-code-display" style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>Teile diesen Code, um der Gruppe beizutreten:</p>
            <h2 style={{ fontWeight: 'bold', color: '#4CAF50' }}>{generatedCode}</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateGroup;
