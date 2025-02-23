// routes/notesRoutes.js
const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { ensureAuthenticated } = require('../routes/auth'); 

// 1) ALLE ROOT-ORDNER/NOTIZEN LADEN
router.get('/all/:calendarId', ensureAuthenticated, async (req, res) => {
  try {
    const { calendarId } = req.params;

    // Beispiel: Du speicherst in Note.js "calendar" als String, 
    // wenn dein Kalender "xxx@group.calendar.google.com" ist:
    const notes = await Note.find({
      user: req.user._id,
      calendar: calendarId,  // String-Vergleich
    }).populate('parent');

    // Schicke sie alle zurück, das Frontend baut den Tree:
    res.json({ success: true, notes });
  } catch (err) {
    console.error('Fehler beim Laden der Notizen:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Notizen' });
  }
});


// 2) NEUE NOTIZ / ORDNER ERSTELLEN
router.post('/', ensureAuthenticated, async (req, res) => {
  const { calendarId, title, content, isFolder, parent } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Titel erforderlich' });
  }

  try {
    const newNote = await Note.create({
      user: req.user._id,
      calendar: calendarId,
      title,
      content: content || '',
      isFolder: isFolder || false,
      parent: parent || null,
    });

    res.json({ success: true, note: newNote });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fehler beim Erstellen der Notiz' });
  }
});

// 3) NOTIZ / ORDNER BEARBEITEN
router.put('/:noteId', ensureAuthenticated, async (req, res) => {
  const { title, content, parent } = req.body;

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.noteId,
      { title, content, parent },
      { new: true }
    );
    res.json({ success: true, note: updatedNote });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fehler beim Bearbeiten der Notiz' });
  }
});

// 4) NOTIZ / ORDNER LÖSCHEN (inkl. Unterelemente)
router.delete('/:noteId', ensureAuthenticated, async (req, res) => {
  try {
    const noteToDelete = await Note.findById(req.params.noteId);
    if (!noteToDelete) {
      return res.status(404).json({ success: false, message: 'Notiz nicht gefunden' });
    }

    // Alle Kinder löschen
    await Note.deleteMany({ parent: noteToDelete._id });
    // Haupt-Dokument löschen
    await Note.findByIdAndDelete(noteToDelete._id);

    res.json({ success: true, message: 'Notiz/Ordner gelöscht' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fehler beim Löschen der Notiz' });
  }
});

module.exports = router;
