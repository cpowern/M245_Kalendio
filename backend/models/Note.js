// models/Note.js
const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  calendar: { type: String, required: true }, // <-- String, nicht ObjectId
  title: { type: String, required: true },
  content: { type: String, default: '' },
  isFolder: { type: Boolean, default: false },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Note', NoteSchema);
