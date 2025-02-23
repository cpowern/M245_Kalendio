// routes/notesRoutes.js

const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { ensureAuthenticated } = require('../routes/auth');

/**
 * 1) ALLE NOTIZEN / ORDNER LADEN
 * GET /notes/all/:calendarId
 * Liefert eine flache Liste aller Notizen/Ordner
 * - Das Frontend baut daraus eine verschachtelte Struktur (Tree).
 */
router.get('/all/:calendarId', ensureAuthenticated, async (req, res) => {
  try {
    const { calendarId } = req.params;

    // Falls du in deinem Note-Schema calendar: { type: String } hast:
    // Wir vergleichen also "calendar" (String) mit "calendarId" (z. B. "xxx@group.calendar.google.com")
    const notes = await Note.find({
      user: req.user._id,
      calendar: calendarId,
    }).populate('parent');

    res.json({ success: true, notes });
  } catch (err) {
    console.error('Fehler beim Laden der Notizen:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Notizen' });
  }
});

/**
 * 2) NEUE NOTIZ / ORDNER ERSTELLEN
 * POST /notes
 * request.body:
 *  - calendarId (String)
 *  - title (String, erforderlich)
 *  - content (String, optional; bei Ordner leer)
 *  - isFolder (Boolean, default: false)
 *  - parent (NoteID oder null)
 */
router.post('/', ensureAuthenticated, async (req, res) => {
  const { calendarId, title, content, isFolder, parent } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Titel erforderlich' });
  }

  try {
    const newNote = await Note.create({
      user: req.user._id,
      calendar: calendarId,   // z. B. "xxx@group.calendar.google.com"
      title,
      content: content || '',
      isFolder: isFolder || false,
      parent: parent || null,
    });

    // Sende das erstellte Note-Dokument zurück,
    // damit das Frontend z. B. die echte _id übernehmen kann.
    res.json({ success: true, note: newNote });
  } catch (err) {
    console.error('Fehler beim Erstellen der Notiz:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Erstellen der Notiz' });
  }
});

/**
 * 3) NOTIZ / ORDNER BEARBEITEN
 * PUT /notes/:noteId
 * request.body: { title, content, parent } (optional)
 */
router.put('/:noteId', ensureAuthenticated, async (req, res) => {
  const { title, content, parent } = req.body;

  try {
    // Führe Update durch
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.noteId,
      { title, content, parent },
      { new: true }
    );
    if (!updatedNote) {
      return res.status(404).json({ success: false, message: 'Notiz nicht gefunden' });
    }
    res.json({ success: true, note: updatedNote });
  } catch (err) {
    console.error('Fehler beim Bearbeiten der Notiz:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Bearbeiten der Notiz' });
  }
});

/**
 * 4) NOTIZ / ORDNER LÖSCHEN (inkl. Kinder)
 * DELETE /notes/:noteId
 * Löscht die Note und alle Unterelemente rekursiv.
 */
router.delete('/:noteId', ensureAuthenticated, async (req, res) => {
  try {
    const noteToDelete = await Note.findById(req.params.noteId);
    if (!noteToDelete) {
      return res.status(404).json({ success: false, message: 'Notiz nicht gefunden' });
    }

    // Alle Kinder löschen (rekursiv):
    await Note.deleteMany({ parent: noteToDelete._id });

    // Haupt-Note selbst löschen
    await Note.findByIdAndDelete(noteToDelete._id);

    res.json({ success: true, message: 'Notiz/Ordner gelöscht' });
  } catch (err) {
    console.error('Fehler beim Löschen der Notiz:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Löschen der Notiz' });
  }
});

module.exports = router;
