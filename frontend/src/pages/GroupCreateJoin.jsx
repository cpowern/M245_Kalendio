import React, { useState } from 'react';

const GroupCreateJoin = () => {
  const [isCreating, setIsCreating] = useState(true); // Toggle zwischen Erstellen und Beitreten
  const [groupCode, setGroupCode] = useState('');

  // Handler für den Wechsel zwischen Erstellen und Beitreten
  const toggleMode = () => {
    setIsCreating(!isCreating);
  };

  // Handler für das Erstellen einer Gruppe
  const handleCreateGroup = () => {
    console.log('Gruppe erstellt!');
  };

  // Handler für das Beitreten einer Gruppe
  const handleJoinGroup = () => {
    console.log(`Beitreten zur Gruppe mit Code: ${groupCode}`);
  };

  return (
    <div className="group-create-join-container">
      <h1>{isCreating ? 'Gruppe Erstellen' : 'Gruppe Beitreten'}</h1>
      <div className="group-form">
        {isCreating ? (
          <div>
            <p>Erstelle eine neue Gruppe und lade Mitglieder ein.</p>
            <button onClick={handleCreateGroup}>Gruppe Erstellen</button>
          </div>
        ) : (
          <div>
            <p>Gib den Gruppencode ein, um einer bestehenden Gruppe beizutreten.</p>
            <input 
              type="text" 
              placeholder="Gruppencode" 
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
            />
            <button onClick={handleJoinGroup}>Gruppe Beitreten</button>
          </div>
        )}
      </div>
      <button onClick={toggleMode}>
        {isCreating ? 'Schon eine Gruppe? Beitreten' : 'Noch keine Gruppe? Erstellen'}
      </button>
    </div>
  );
};

export default GroupCreateJoin;
