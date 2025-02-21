const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar', required: true },
  folder: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Note', NoteSchema);
