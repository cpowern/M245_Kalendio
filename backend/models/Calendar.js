// models/Calendar.js
const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  calendarId: { type: String, required: true },
  groupCode: { type: String, required: true, unique: true },
  
  // NEU HINZUGEFÜGT: Owner-Feld
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // NEU HINZUGEFÜGT: Mitgliederzahl
  membersCount: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model('Calendar', CalendarSchema);
