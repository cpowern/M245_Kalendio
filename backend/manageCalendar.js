//managecalendar.js
const express = require('express');
const router = express.Router();
const { createCalendar, calendar } = require('../backend/googleCalendar'); // Kalender- und Erstellfunktion importieren
const Group = require('../backend/models/Group'); // Group-Modell importieren

(async () => {
  console.log('Skript gestartet...');

  try {
    // Versuche, einen Kalender zu erstellen
    const calendarId = await createCalendar('Beispiel Kalender');
    console.log('Kalender erfolgreich erstellt mit der ID:', calendarId);
  } catch (error) {
    console.error('Fehler beim Erstellen des Kalenders:', error);
  }
})();

// Route zum Erstellen einer Gruppe
router.post('/groups/create', async (req, res) => {
  const { groupName, membersCount, ranked } = req.body;

  try {
    // Kalender erstellen
    const calendarId = await createCalendar(groupName);

    // Neue Gruppe in der Datenbank speichern
    const newGroup = new Group({
      groupName,
      calendarId,
      membersCount,
      ranked,
      groupCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
    });
    await newGroup.save();

    res.status(201).json({ success: true, message: 'Gruppe erstellt', groupId: newGroup._id });
  } catch (error) {
    console.error('Fehler beim Erstellen der Gruppe:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Erstellen der Gruppe' });
  }
});

// Route zum Beitreten einer Gruppe
router.post('/groups/join', async (req, res) => {
  const { groupCode, userEmail } = req.body;

  try {
    // Gruppe über den Code finden
    const group = await Group.findOne({ groupCode });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Gruppe nicht gefunden' });
    }

    // Nutzer zum Kalender hinzufügen
    await calendar.acl.insert({
      calendarId: group.calendarId,
      requestBody: {
        role: 'writer', // Der Nutzer kann Änderungen vornehmen
        scope: {
          type: 'user',
          value: userEmail,
        },
      },
    });

    res.status(200).json({ success: true, message: 'Erfolgreich der Gruppe beigetreten' });
  } catch (error) {
    console.error('Fehler beim Beitreten der Gruppe:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Beitreten der Gruppe' });
  }
});

module.exports = router;
