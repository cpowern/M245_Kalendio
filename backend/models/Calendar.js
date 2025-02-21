// models/Calendar.js
const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  calendarId: { type: String, required: true },
  groupCode: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Speichert alle beigetretenen User
});

module.exports = mongoose.model('Calendar', CalendarSchema);
